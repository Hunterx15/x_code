const redisClient = require("../config/redis");
const User = require("../models/user");
const validate = require("../utils/validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Submission = require("../models/submission");
const { cookieOptions, clearCookieOptions } = require("../config/cookieConfig");

const register = async (req, res) => {
  try {
    // validate the data;

    validate(req.body);
    const { firstName, lastName, emailId, password, age } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Bug #8 fix: explicitly pick only allowed fields — no mass assignment.
    // Prevents clients from injecting problemSolved, googleId, role, etc.
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
      message: "Loggin Successfully",
    });
  } catch (err) {
    res.status(400).send("Error: " + err);
  }
};

const login = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId) throw new Error("Invalid Credentials");
    if (!password) throw new Error("Invalid Credentials");

    // Bug #15 fix: lowercase email before query — the schema lowercases on
    // save but Mongoose does NOT auto-lowercase query values.
    // Bug #14 fix: null-check the user before calling bcrypt.compare.
    const user = await User.findOne({ emailId: emailId.toLowerCase() });
    if (!user) throw new Error("Invalid Credentials");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid Credentials");

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
    res.status(201).json({
      user: reply,
      message: "Loggin Successfully",
    });
  } catch (err) {
    res.status(401).send("Error: " + err);
  }
};

// logOut feature

const logout = async (req, res) => {
  const { token } = req.cookies;

  // Bug #4 fix: ALWAYS clear the cookie first, regardless of Redis state.
  // If Redis is down, the user's browser still loses the cookie — they are
  // effectively logged out even though the token isn't blocklisted.
  res.cookie("token", null, clearCookieOptions());

  try {
    const payload = jwt.decode(token);
    if (payload?.exp) {
      await redisClient.set(`token:${token}`, "Blocked");
      await redisClient.expireAt(`token:${token}`, payload.exp);
    }
    res.send("Logged Out Succesfully");
  } catch (err) {
    // Cookie is already cleared. Redis blocklist failed, but the token is no
    // longer in the browser. Log the error and return success to the user.
    console.error("Logout: failed to blocklist token in Redis", err);
    res.send("Logged Out Succesfully");
  }
};

const adminRegister = async (req, res) => {
  try {
    validate(req.body);
    const { firstName, lastName, emailId, password, age } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Bug #8 fix: explicitly pick only allowed fields — no mass assignment.
    const user = await User.create({
      firstName,
      lastName,
      emailId,
      password: hashedPassword,
      age,
    });
    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 },
    );
    res.cookie("token", token, cookieOptions());
    res.status(201).send("User Registered Successfully");
  } catch (err) {
    res.status(400).send("Error: " + err);
  }
};

const deleteProfile = async (req, res) => {
  try {
    const userId = req.result._id;

    // userSchema delete
    await User.findByIdAndDelete(userId);

    // Submission se bhi delete karo...

    // await Submission.deleteMany({userId});

    res.status(200).send("Deleted Successfully");
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
};

module.exports = { register, login, logout, adminRegister, deleteProfile };
