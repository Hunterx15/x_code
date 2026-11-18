// ---------------------------------------------------------------------------
// Centralized distributed rate-limit policies.
//
// Uses Redis atomic INCR + EXPIRE for horizontally scalable rate limiting
// across multiple backend instances, with automatic fail-over to in-memory
// express-rate-limit if Redis is unavailable.
//
// Policies:
//   - authLimiter       : IP-based, protects login/register against brute force
//   - oauthLimiter      : IP-based, protects Google OAuth start/callback/exchange
//   - aiChatLimiter     : User-based (falls back to IP), protects Gemini API quota
//   - submissionLimiter : User-based (falls back to IP), protects Judge0 API quota
// ---------------------------------------------------------------------------

const rateLimit = require("express-rate-limit");
const redisClient = require("../config/redis");

const createDistributedLimiter = ({
  prefix,
  windowMs,
  max,
  message,
  keyByUser = false,
}) => {
  const fallbackLimiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message, message },
  });

  return async (req, res, next) => {
    if (!redisClient.isOpen) {
      return fallbackLimiter(req, res, next);
    }

    try {
      const identifier =
        keyByUser && req.result?._id
          ? `u:${req.result._id.toString()}`
          : `ip:${req.ip || req.socket?.remoteAddress || "unknown"}`;

      const windowSec = Math.max(Math.ceil(windowMs / 1000), 1);
      const bucket = Math.floor(Date.now() / windowMs);
      const key = `rl:${prefix}:${identifier}:${bucket}`;

      const count = await redisClient.incr(key);
      if (count === 1) {
        await redisClient.expire(key, windowSec + 1);
      }

      const remaining = Math.max(max - count, 0);
      res.setHeader("RateLimit-Limit", max);
      res.setHeader("RateLimit-Remaining", remaining);

      if (count > max) {
        res.setHeader("Retry-After", windowSec);
        return res.status(429).json({ error: message, message });
      }

      return next();
    } catch (err) {
      console.warn(
        `Redis rate limiter (${prefix}) error, falling back to in-memory:`,
        err.message
      );
      return fallbackLimiter(req, res, next);
    }
  };
};

// Auth limiter — applies to login and signup.
// Default: 10 attempts per 15 minutes per IP.
const authLimiter = createDistributedLimiter({
  prefix: "auth",
  windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX) || 10,
  message: "Too many authentication attempts, please try again later.",
  keyByUser: false,
});

// Google OAuth limiter — applies to /auth/google, /callback, and /exchange.
// Default: 15 requests per 15 minutes per IP.
const oauthLimiter = createDistributedLimiter({
  prefix: "oauth",
  windowMs: Number(process.env.RATE_LIMIT_OAUTH_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_OAUTH_MAX) || 15,
  message: "Too many Google sign-in attempts, please try again later.",
  keyByUser: false,
});

// AI chat limiter — applies to /ai/chat (after userMiddleware).
// Default: 20 messages per minute per authenticated user.
const aiChatLimiter = createDistributedLimiter({
  prefix: "ai",
  windowMs: Number(process.env.RATE_LIMIT_AI_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AI_MAX) || 20,
  message: "Too many AI requests, please slow down.",
  keyByUser: true,
});

// Code execution limiter — applies to /submission/run and /submission/submit (after userMiddleware).
// Default: 15 executions per minute per authenticated user to protect Judge0 quota.
const submissionLimiter = createDistributedLimiter({
  prefix: "submit",
  windowMs: Number(process.env.RATE_LIMIT_SUBMIT_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.RATE_LIMIT_SUBMIT_MAX) || 15,
  message: "Too many code executions. Please wait a moment before running again.",
  keyByUser: true,
});

module.exports = {
  authLimiter,
  oauthLimiter,
  aiChatLimiter,
  submissionLimiter,
};
