const authService = require('./auth.service');
const { validateRegister, validateLogin, validateVerifyEmail } = require('./auth.validator');
const { success, error } = require('../../utils/response');

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: true, // MUST be true for sameSite: 'none'
    sameSite: 'none', // Required for cross-domain cookies (Vercel frontend -> Render backend)
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

exports.register = async (req, res) => {
  try {
    const validationError = validateRegister(req.body);
    if (validationError) return error(res, validationError);

    const result = await authService.register(req.body);
    return success(res, result, 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.login = async (req, res) => {
  try {
    const validationError = validateLogin(req.body);
    if (validationError) return error(res, validationError);

    const { user, accessToken, refreshToken } = await authService.login(req.body);
    
    setRefreshTokenCookie(res, refreshToken);
    
    // Return refreshToken in payload to support Safari ITP bypass
    return success(res, { user, accessToken, refreshToken });
  } catch (err) {
    if (err.needsVerification) {
      return res.status(err.status).json({
        success: false,
        error: { message: err.message, needsVerification: true }
      });
    }
    return error(res, err.message, err.status || 500);
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const validationError = validateVerifyEmail(req.body);
    if (validationError) return error(res, validationError);

    const { user, accessToken, refreshToken } = await authService.verifyEmail(req.body);
    
    setRefreshTokenCookie(res, refreshToken);
    
    // Return refreshToken in payload
    return success(res, { user, accessToken, refreshToken });
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.resendOtp = async (req, res) => {
  try {
    if (!req.body.email) return error(res, 'Email is required');
    
    const result = await authService.resendOtp(req.body);
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.refreshToken = async (req, res) => {
  try {
    // Safari blocks 3rd party cookies, so we accept refreshToken from the body as a fallback
    const token = req.body.refreshToken || req.cookies.refreshToken;
    if (!token) return error(res, 'Refresh token not found', 401);

    const { user, accessToken, refreshToken } = await authService.refreshToken(token);
    
    setRefreshTokenCookie(res, refreshToken);
    
    // Return refreshToken in payload
    return success(res, { user, accessToken, refreshToken });
  } catch (err) {
    // Clear cookie if token is invalid
    res.clearCookie('refreshToken');
    return error(res, err.message, err.status || 401);
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.body.refreshToken || req.cookies.refreshToken;
    await authService.logout(req.userId, token);
    
    res.clearCookie('refreshToken');
    return success(res, { message: 'Logged out successfully' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getMe = async (req, res) => {
  try {
    const result = await authService.getMe(req.userId);
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};
