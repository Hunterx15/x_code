const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");

// ---------------------------------------------------------------------------
// Authentication middleware.
//
// Reads the JWT from the `token` cookie, verifies it, loads the user from
// MongoDB, and checks that the token hasn't been blocklisted in Redis (used
// on logout to invalidate tokens before their natural expiry).
//
// On success, attaches the fresh user doc to `req.result` and calls next().
// On failure, returns a 401 JSON response with `{ error, message }` so the
// frontend's axios error handler (which reads error.response.data.error or
// .message) works correctly.
//
// BUG FIXES:
//   1. Previously sent `res.status(401).send("Error: " + err.message)` which
//      is plain text, not JSON — broke the frontend's error parsing.
//   2. Did not call next(err), so the centralized error handler never fired.
//   3. Did not guard against Redis being unavailable (the exists() call would
//      throw, taking the whole request down even though the JWT was valid).
// ---------------------------------------------------------------------------

const userMiddleware = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({
        error: "Token is not present",
        message: "Token is not present",
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_KEY);
    } catch (err) {
      return res.status(401).json({
        error: "Invalid or expired token",
        message: "Invalid or expired token",
      });
    }

    const { _id } = payload;
    if (!_id) {
      return res.status(401).json({ error: "Invalid token", message: "Invalid token" });
    }

    const result = await User.findById(_id);
    if (!result) {
      return res.status(401).json({
        error: "User doesn't exist",
        message: "User doesn't exist",
      });
    }

    // Check the Redis blocklist. Wrap in try/catch so a Redis outage
    // doesn't take down the entire API — if Redis is unavailable, we
    // fail OPEN (allow the request) and log the error. This matches the
    // behavior of the EdgeFlow rate limiter.
    try {
      const isBlocked = await redisClient.exists(`token:${token}`);
      if (isBlocked) {
        return res.status(401).json({
          error: "Token has been revoked",
          message: "Token has been revoked",
        });
      }
    } catch (redisErr) {
      console.error("userMiddleware: Redis check failed, failing open:", redisErr.message);
    }

    req.result = result;
    next();
  } catch (err) {
    // Unexpected error — delegate to Express's error pipeline so the
    // centralized errorHandler can log it and return a consistent shape.
    next(err);
  }
};

module.exports = userMiddleware;
