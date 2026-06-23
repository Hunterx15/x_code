// ---------------------------------------------------------------------------
// Centralized rate-limit policies (express-rate-limit v7).
//
// Conservative limits that do NOT affect normal users but DO block scripted
// abuse (credential stuffing, OAuth farming, AI cost farming).
//
// Limits are configurable via env vars but ship with safe defaults.
// ---------------------------------------------------------------------------

const rateLimit = require("express-rate-limit");

// Auth limiter — applies to login, signup, and Google OAuth entry points.
// Default: 10 attempts per 15 minutes per IP.
//   - A normal user types their password 1-3 times per session.
//   - A brute-force attack needs thousands of attempts per second.
const authLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts, please try again later." },
});

// Google OAuth limiter — applies to BOTH /user/auth/google and /user/auth/google/callback.
// Default: 10 starts per 15 minutes per IP (each start triggers up to 1 callback).
//   - A normal user signs in via Google at most a few times per day.
//   - An attacker could otherwise farm Google tokens or probe redirect_uri misconfig.
const oauthLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_OAUTH_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_OAUTH_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many Google sign-in attempts, please try again later." },
});

// AI chat limiter — applies to /ai/chat.
// Default: 20 messages per minute per IP.
//   - A normal back-and-forth DSA tutoring session is ~10-30 messages/hour.
//   - An attacker could otherwise run up Gemini API bills in minutes.
const aiChatLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_AI_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AI_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests, please slow down." },
});

module.exports = { authLimiter, oauthLimiter, aiChatLimiter };
