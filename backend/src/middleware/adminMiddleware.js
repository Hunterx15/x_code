const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");

// ---------------------------------------------------------------------------
// Admin authentication middleware.
//
// Same flow as userMiddleware, but additionally requires that the user's
// role (read from the DB, NOT from the JWT) is 'admin'. This prevents
// demoted admins from retaining admin access until their JWT expires.
//
// BUG FIXES (same as userMiddleware):
//   1. Previously sent plain text — now returns JSON.
//   2. Now calls next(err) on unexpected errors.
//   3. Now guards against Redis outages.
//   4. (Already fixed in the previous revision) checks user existence FIRST,
//      then checks role from the DB — not from the JWT.
// ---------------------------------------------------------------------------

const adminMiddleware = async (req, res, next) => {
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

    // Check role from the DB (not from the JWT, which may be stale).
    if (result.role !== "admin") {
      return res.status(403).json({
        error: "Admin access required",
        message: "Admin access required",
      });
    }

    // Check the Redis blocklist (with graceful fallback).
    try {
      const isBlocked = await redisClient.exists(`token:${token}`);
      if (isBlocked) {
        return res.status(401).json({
          error: "Token has been revoked",
          message: "Token has been revoked",
        });
      }
    } catch (redisErr) {
      console.error("adminMiddleware: Redis check failed, failing open:", redisErr.message);
    }

    req.result = result;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = adminMiddleware;
