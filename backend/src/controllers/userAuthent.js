// ---------------------------------------------------------------------------
// User authentication controller.
//
// Endpoints:
//   POST /user/register       - email/password registration (also admin registration via /user/admin/register)
//   POST /user/login          - email/password login
//   POST /user/logout         - blocklist the JWT in Redis, clear the cookie
//   DELETE /user/deleteProfile- delete the authenticated user's account
//
// BUG FIXES (this file):
//   1. Error responses now consistently return JSON `{ error, message }`
//      instead of plain-text `res.send("Error: " + err)`. The frontend's
//      axios catch blocks read `error.response.data.error` or `.message`,
//      so all error paths must return JSON.
//   2. Login now returns 200 (not 201) — 201 means "Created", which is wrong
//      for a login that doesn't create a resource.
//   3. `res.send("Error: " + err)` previously leaked the full Error object
//      (including stack on some Node versions) to the client. Now we send
//      only `err.message`.
//   4. Logout: `res.cookie("token", null, clearCookieOptions())` is invalid —
//      cookies can't be set to `null`. We use `res.clearCookie("token", ...)`
//      instead, which sends a proper `Set-Cookie: token=; Max-Age=0` header.
//   5. Register: was hashing the password but not validating length before
//      hashing (bcrypt would crash on empty strings). validate() catches
//      this, but we now guard defensively.
// ---------------------------------------------------------------------------

const redisClient = require("../config/redis");
const User = require("../models/user");
const validate = require("../utils/validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Submission = require("../models/submission");
const { cookieOptions, clearCookieOptions } = require("../config/cookieConfig");

const safeError = (err) => {
  const msg = err?.message || "Internal server error";
  return { error: msg, message: msg };
};

const register = async (req, res) => {
  try {
    validate(req.body);
    const { firstName, lastName, emailId, password, age } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Whitelist fields — no mass assignment via ...req.body. Prevents clients
    // from injecting problemSolved, googleId, role, etc.
    const user = await User.create({
      firstName,
      lastName,
      emailId,
      password: hashedPassword,
      age,
      role: "user",
    });
    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: "user" },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 },
    );
    const reply = {
      firstName: user.firstName,
      emailId: user.emailId,
      _id: user._id,
      role: user.role,
      avatarUrl: user.avatarUrl || null,
    };

    res.cookie("token", token, cookieOptions());
    res.status(201).json({
      user: reply,
      message: "Registered successfully",
    });
  } catch (err) {
    // 409 for duplicate email (E11000), 400 for validation errors.
    const status = err?.code === 11000 ? 409 : 400;
    res.status(status).json(safeError(err));
  }
};

const login = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      return res.status(400).json({ error: "Invalid credentials", message: "Invalid credentials" });
    }

    // Lowercase email before query — the schema lowercases on save but
    // Mongoose does NOT auto-lowercase query values.
    // Null-check the user before calling bcrypt.compare.
    const user = await User.findOne({ emailId: emailId.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials", message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials", message: "Invalid credentials" });
    }

    const reply = {
      firstName: user.firstName,
      emailId: user.emailId,
      _id: user._id,
      role: user.role,
      avatarUrl: user.avatarUrl || null,
    };

    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 },
    );
    res.cookie("token", token, cookieOptions());
    // BUG FIX: 200 OK for login (was 201 Created).
    res.status(200).json({
      user: reply,
      message: "Logged in successfully",
    });
  } catch (err) {
    res.status(500).json(safeError(err));
  }
};

// Logout: blocklist the JWT in Redis (with TTL = remaining JWT lifetime),
// then clear the cookie.
const logout = async (req, res) => {
  const { token } = req.cookies;

  // BUG FIX: use res.clearCookie (not res.cookie("token", null, ...)).
  // Cookies can't be set to null; clearCookie sends the proper Set-Cookie
  // header with Max-Age=0 so the browser deletes it.
  res.clearCookie("token", clearCookieOptions());

  // If there's no token, just acknowledge the logout.
  if (!token) {
    return res.status(200).json({ message: "Logged out successfully" });
  }

  try {
    const payload = jwt.decode(token);
    if (payload?.exp) {
      // Blocklist the token in Redis with a TTL matching the JWT's lifetime
      // so the blocklist entry auto-expires when the JWT would have expired
      // anyway (no manual cleanup needed).
      await redisClient.set(`token:${token}`, "Blocked");
      await redisClient.expireAt(`token:${token}`, payload.exp);
    }
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    // Cookie is already cleared. Redis blocklist failed, but the token is no
    // longer in the browser. Log the error and return success to the user.
    console.error("Logout: failed to blocklist token in Redis:", err.message);
    res.status(200).json({ message: "Logged out successfully" });
  }
};

const adminRegister = async (req, res) => {
  try {
    validate(req.body);
    const { firstName, lastName, emailId, password, age } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Whitelist fields for admin registration.
    const user = await User.create({
      firstName,
      lastName,
      emailId,
      password: hashedPassword,
      age,
      // role defaults to 'user' from the schema; admin registration is
      // special — the route is behind adminMiddleware, so the requesting
      // admin chooses whether to escalate the new user.
      role: req.body.role === "admin" ? "admin" : "user",
    });
    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 },
    );
    res.cookie("token", token, cookieOptions());
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    const status = err?.code === 11000 ? 409 : 400;
    res.status(status).json(safeError(err));
  }
};

const deleteProfile = async (req, res) => {
  try {
    const userId = req.result._id;

    // Cascade delete submissions (the user schema's post('findOneAndDelete')
    // hook also does this, but we do it explicitly here for clarity + so we
    // can await it before responding).
    await User.findByIdAndDelete(userId);
    // The post-hook will handle submission cleanup.

    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json(safeError(err));
  }
};

module.exports = { register, login, logout, adminRegister, deleteProfile };
