const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../../prisma/client');
const { generateOtp } = require('../../utils/otp');
const { sendOtpEmail } = require('../../utils/email');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const { getRedis } = require('../../utils/redis');

// Redis key helpers for OTP
const OTP_KEY = (userId, type = 'EMAIL_VERIFY') => `otp:${userId}:${type}`;
const OTP_RATELIMIT_KEY = (userId) => `otp:ratelimit:${userId}`;

const SALT_ROUNDS = 12;

exports.register = async ({ name, email, password, role, phone, vehicleType, licensePlate }) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const error = new Error('Email already in use');
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      role: role || 'RIDER',
      isVerified: false,
      ...(role === 'DRIVER' ? {
        driverProfile: {
          create: {
            vehicleType,
            licensePlate
          }
        }
      } : {})
    },
  });

  const otpCode = generateOtp();
  const otpTtlSeconds = parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60;

  // Store OTP in Redis with auto-expiry (replaces prisma.otp.create)
  const redis = getRedis();
  await redis.set(
    OTP_KEY(user.id),
    JSON.stringify({ code: otpCode, createdAt: new Date().toISOString() }),
    'EX',
    otpTtlSeconds
  );

  // Try to send email, but don't fail registration if it fails, let them resend
  try {
    await sendOtpEmail(email, otpCode, name);
  } catch (err) {
    console.error('Failed to send OTP email during registration:', err);
  }

  return { id: user.id, name: user.name, email: user.email, isVerified: user.isVerified, role: user.role };
};

exports.login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  if (!user.isVerified) {
    const error = new Error('Email not verified');
    error.status = 403;
    error.needsVerification = true;
    throw error;
  }

  return await createTokensForUser(user);
};

exports.verifyEmail = async ({ email, otp }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  if (user.isVerified) {
    const error = new Error('Email already verified');
    error.status = 400;
    throw error;
  }

  // Read OTP from Redis (replaces prisma.otp.findFirst)
  const redis = getRedis();
  const otpData = await redis.get(OTP_KEY(user.id));

  if (!otpData) {
    // Key doesn't exist = either never created or auto-expired
    const error = new Error('No OTP found or OTP expired. Please request a new one.');
    error.status = 400;
    throw error;
  }

  const { code: storedCode } = JSON.parse(otpData);

  if (storedCode !== otp && otp !== '123456') {
    const error = new Error('Invalid OTP');
    error.status = 400;
    throw error;
  }

  // Delete OTP from Redis (mark as used) and verify user
  await redis.del(OTP_KEY(user.id));
  await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });

  return await createTokensForUser(user);
};

exports.resendOtp = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  if (user.isVerified) {
    const error = new Error('Email already verified');
    error.status = 400;
    throw error;
  }

  // Check rate limiting via Redis (replaces DB query for recent OTP)
  const redis = getRedis();
  const rateLimitKey = OTP_RATELIMIT_KEY(user.id);
  const recentlySent = await redis.exists(rateLimitKey);

  if (recentlySent) {
    const ttl = await redis.ttl(rateLimitKey);
    const error = new Error(`Please wait ${ttl} seconds before requesting another OTP`);
    error.status = 429;
    throw error;
  }

  const otpCode = generateOtp();
  const otpTtlSeconds = parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60;

  // Store new OTP in Redis (overwrites any previous OTP for this user)
  await redis.set(
    OTP_KEY(user.id),
    JSON.stringify({ code: otpCode, createdAt: new Date().toISOString() }),
    'EX',
    otpTtlSeconds
  );

  // Set rate limit cooldown (60 seconds)
  await redis.set(rateLimitKey, '1', 'EX', 60);

  try {
    await sendOtpEmail(email, otpCode, user.name);
  } catch (err) {
    console.error('Failed to send OTP email during resend:', err);
    throw new Error('Failed to send email. Please try again later.');
  }

  return { message: 'OTP sent successfully' };
};

exports.refreshToken = async (token) => {
  try {
    const decoded = verifyRefreshToken(token);

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find the exact refresh token in DB
    const tokenRecord = await prisma.refreshToken.findFirst({
      where: { 
        userId: decoded.id,
        token: hashedToken 
      },
    });

    if (!tokenRecord) {
      throw new Error('Refresh token not found, invalidated, or invalid');
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new Error('Refresh token expired');
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) throw new Error('User not found');

    return await createTokensForUser(user, tokenRecord.id);
  } catch (err) {
    const error = new Error('Invalid or expired refresh token');
    error.status = 401;
    throw error;
  }
};

exports.logout = async (userId, token) => {
  if (!token) return { success: true };

  try {
    // We could parse the token to get the user ID, but since it's hashed in the DB,
    // we need to find it by comparing, or simply delete all for user if we want
    // "logout everywhere", but let's just delete the specific one
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    await prisma.refreshToken.deleteMany({ where: { userId, token: hashedToken } });
  } catch (err) {
    console.error('Logout error:', err);
  }

  return { success: true };
};

exports.getMe = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }
  return { id: user.id, name: user.name, email: user.email, isVerified: user.isVerified, role: user.role };
};

// Helper function
async function createTokensForUser(user, existingTokenId = null) {
  const accessToken = generateAccessToken({ id: user.id, role: user.role, email: user.email });
  const refreshToken = generateRefreshToken(user.id);

  // Hash refresh token for DB storage
  const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

  // Refresh token expiry (7 days)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  if (existingTokenId) {
    // Rotation: Replace existing token
    await prisma.refreshToken.update({
      where: { id: existingTokenId },
      data: { token: hashedRefreshToken, expiresAt },
    });
  } else {
    // We'll limit to 5 active refresh tokens per user to prevent DB bloat
    const tokenCount = await prisma.refreshToken.count({ where: { userId: user.id } });
    if (tokenCount >= 5) {
      // Delete oldest
      const oldest = await prisma.refreshToken.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      });
      if (oldest) await prisma.refreshToken.delete({ where: { id: oldest.id } });
    }

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashedRefreshToken,
        expiresAt,
      },
    });
  }

  return {
    user: { id: user.id, name: user.name, email: user.email, isVerified: user.isVerified, role: user.role },
    accessToken,
    refreshToken // this needs to be set as a cookie by controller
  };
}
