/**
 * Redis-backed sliding window rate limiter middleware.
 *
 * Strategy: fixed window via Redis INCR + EXPIRE (simple, low-latency, no Lua needed).
 *   Key: `rl:{windowLabel}:{identifier}`
 *   On first request in a window: INCR creates the key and we SET EXPIRE.
 *   On subsequent requests: INCR increments, EXPIRE is NOT reset (window is fixed).
 *
 * Two pre-configured limiters are exported:
 *   - authLimiter  : 10 req / 15 min per IP  — protects login/register/OTP from brute-force
 *   - apiLimiter   : 100 req / 1 min per user — general API throttle
 *
 * Response headers (standard):
 *   X-RateLimit-Limit      — max requests in window
 *   X-RateLimit-Remaining  — requests left
 *   X-RateLimit-Reset      — Unix timestamp when the window resets
 *   Retry-After            — seconds to wait (only on 429)
 */

const { getRedis } = require('../utils/redis');

/**
 * Create a rate limiter middleware.
 *
 * @param {object} options
 * @param {number}   options.windowMs    - Window size in milliseconds
 * @param {number}   options.max         - Max requests per window
 * @param {string}   [options.keyPrefix] - Redis key prefix (default: 'rl')
 * @param {function} [options.keyFn]     - Custom key builder: (req) => string identifier
 *                                         Defaults to IP for public routes, userId for auth routes.
 * @param {string}   [options.message]   - Error message on 429
 */
function createRateLimiter({
  windowMs,
  max,
  keyPrefix = 'rl',
  keyFn = null,
  message = 'Too many requests. Please try again later.',
}) {
  const windowSecs = Math.ceil(windowMs / 1000);

  return async function rateLimiterMiddleware(req, res, next) {
    let redis;
    try {
      redis = getRedis();
    } catch (_) {
      // Redis not ready (e.g. during cold start) — fail open to avoid blocking requests
      return next();
    }

    // Build the identifier (IP or userId)
    let identifier;
    if (keyFn) {
      identifier = keyFn(req);
    } else {
      // Prefer authenticated userId, fallback to IP
      identifier = req.userId
        || req.headers['x-forwarded-for']?.split(',')[0].trim()
        || req.socket?.remoteAddress
        || 'unknown';
    }

    // Window label: which fixed window are we in?
    const windowIndex = Math.floor(Date.now() / windowMs);
    const redisKey = `${keyPrefix}:${windowIndex}:${identifier}`;

    try {
      // INCR atomically increments (creates key if missing, starting at 0 → 1)
      const count = await redis.incr(redisKey);

      // Set expiry only on first request in this window
      if (count === 1) {
        await redis.expire(redisKey, windowSecs);
      }

      // Calculate reset timestamp (end of current window)
      const resetAt = (windowIndex + 1) * windowMs;
      const resetAtSecs = Math.ceil(resetAt / 1000);
      const remaining = Math.max(0, max - count);

      // Set standard rate limit headers on every response
      res.set('X-RateLimit-Limit', String(max));
      res.set('X-RateLimit-Remaining', String(remaining));
      res.set('X-RateLimit-Reset', String(resetAtSecs));

      if (count > max) {
        const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
        res.set('Retry-After', String(Math.max(1, retryAfter)));
        return res.status(429).json({
          success: false,
          error: { message },
        });
      }

      return next();
    } catch (err) {
      // Redis error — fail open (don't block legit traffic)
      console.error('Rate limiter Redis error:', err.message);
      return next();
    }
  };
}

// ─── Pre-configured limiters ──────────────────────────────────────────────────

/**
 * Auth limiter: 10 requests per 15 minutes per IP.
 * Applied to: /api/auth/login, /api/auth/register, /api/auth/resend-otp
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyPrefix: 'rl:auth',
  // Always key by IP for auth routes (no userId yet)
  keyFn: (req) =>
    req.headers['x-forwarded-for']?.split(',')[0].trim()
    || req.socket?.remoteAddress
    || 'unknown',
  message: 'Too many auth attempts. Please wait 15 minutes before trying again.',
});

/**
 * API limiter: 100 requests per minute per authenticated user.
 * Applied to: all /api/* routes after authentication.
 */
const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  keyPrefix: 'rl:api',
  // Key by userId (set by authenticate middleware) or IP as fallback
  keyFn: (req) =>
    req.userId
    || req.headers['x-forwarded-for']?.split(',')[0].trim()
    || req.socket?.remoteAddress
    || 'unknown',
  message: 'API rate limit exceeded. Please slow down.',
});

module.exports = { createRateLimiter, authLimiter, apiLimiter };
