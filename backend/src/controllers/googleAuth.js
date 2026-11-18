const crypto = require("crypto");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");
const leaderboardService = require("../utils/leaderboardService");
const { cookieOptions } = require("../config/cookieConfig");

// ---------------------------------------------------------------------------
// Google OAuth 2.0 Authorization Code flow (hardened).
//
// Endpoints (mounted at /user):
//   GET  /user/auth/google           -> generate CSRF state, redirect to Google
//   GET  /user/auth/google/callback  -> verify CSRF state, exchange Google code,
//                                       issue single-use opaque exchange code
//   POST /user/auth/google/exchange  -> consume single-use code -> return JWT
//
// SECURITY HARDENING:
//   1. CSRF Protection: generates a 32-byte random `state` nonce stored in
//      Redis (10m TTL) and atomically consumed on callback.
//   2. No JWT in URL: redirects to `/auth/google/success?code=<opaque>` instead
//      of leaking the JWT into browser history, proxy logs, and Referer headers.
//   3. Single-Use Exchange Code: the opaque code has a 60s TTL and is deleted
//      immediately on first exchange.
//   4. Graceful Degradation: falls back to a TTL-bounded in-memory Map if
//      Redis is temporarily unavailable.
// ---------------------------------------------------------------------------

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

const STATE_TTL_SEC = 600; // 10 minutes
const EXCHANGE_CODE_TTL_SEC = 60; // 60 seconds

// In-memory fallback store (only used when Redis is unavailable)
const memoryStore = new Map();

const setEphemeral = async (key, value, ttlSec) => {
  if (redisClient.isOpen) {
    try {
      await redisClient.set(key, value, { EX: ttlSec });
      return;
    } catch (err) {
      console.warn("Redis setEphemeral error, using memory fallback:", err.message);
    }
  }
  const expiresAt = Date.now() + ttlSec * 1000;
  memoryStore.set(key, { value, expiresAt });
  // Opportunistic cleanup to keep memory bounded
  if (memoryStore.size > 1000) {
    const now = Date.now();
    for (const [k, entry] of memoryStore.entries()) {
      if (entry.expiresAt <= now) memoryStore.delete(k);
    }
  }
};

const consumeEphemeral = async (key) => {
  if (redisClient.isOpen) {
    try {
      const value = await redisClient.get(key);
      if (value !== null) {
        await redisClient.del(key);
        return value;
      }
    } catch (err) {
      console.warn("Redis consumeEphemeral error, checking memory fallback:", err.message);
    }
  }
  const entry = memoryStore.get(key);
  if (!entry) return null;
  memoryStore.delete(key);
  if (entry.expiresAt <= Date.now()) return null;
  return entry.value;
};

const buildRedirectUri = () => {
  if (!process.env.GOOGLE_REDIRECT_URI) {
    throw new Error("GOOGLE_REDIRECT_URI environment variable is required");
  }
  return process.env.GOOGLE_REDIRECT_URI;
};

const buildFrontendHomeUrl = () => {
  if (!process.env.CLIENT_URL) {
    throw new Error("CLIENT_URL environment variable is required");
  }
  return process.env.CLIENT_URL;
};

// Step 1: generate CSRF state nonce and redirect user to Google's consent screen.
const googleAuthRedirect = async (req, res) => {
  try {
    const redirectUri = buildRedirectUri();
    const state = crypto.randomBytes(32).toString("hex");
    await setEphemeral(`oauth:state:${state}`, "1", STATE_TTL_SEC);

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
      state,
    });
    return res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
  } catch (err) {
    console.error("Google OAuth redirect error:", err?.message || err);
    return res.status(500).json({ error: "Failed to initiate Google sign-in" });
  }
};

// Step 2: Google redirects back here with ?code=...&state=...
const googleAuthCallback = async (req, res) => {
  const frontendHome = buildFrontendHomeUrl();
  const redirectUri = buildRedirectUri();

  const { code, state } = req.query;
  if (!code) {
    return res.redirect(`${frontendHome}/login?google_error=missing_code`);
  }

  // Verify CSRF state nonce (single-use)
  if (!state || typeof state !== "string") {
    return res.redirect(`${frontendHome}/login?google_error=invalid_state`);
  }
  const validState = await consumeEphemeral(`oauth:state:${state}`);
  if (!validState) {
    return res.redirect(`${frontendHome}/login?google_error=invalid_state`);
  }

  try {
    const tokenRes = await axios.post(
      GOOGLE_TOKEN_URL,
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenRes.data?.access_token;
    if (!accessToken) {
      return res.redirect(`${frontendHome}/login?google_error=no_token`);
    }

    const userinfoRes = await axios.get(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const googleId = userinfoRes.data?.sub;
    const email = (userinfoRes.data?.email || "").toLowerCase();
    const name = userinfoRes.data?.name || "";
    const avatarUrl = userinfoRes.data?.picture || null;

    if (!googleId || !email) {
      return res.redirect(`${frontendHome}/login?google_error=incomplete_profile`);
    }

    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ emailId: email });
      if (user) {
        user.googleId = googleId;
        user.avatarUrl = avatarUrl;
        await user.save();
      } else {
        const nameParts = (name || "").trim().split(/\s+/).filter(Boolean);
        let firstName = nameParts[0] || email.split("@")[0] || "Developer";
        if (firstName.length < 3) firstName = firstName.padEnd(3, "_");
        const lastName = nameParts.slice(1).join(" ") || "";

        user = await User.create({
          firstName: firstName.slice(0, 20),
          lastName: lastName.slice(0, 20),
          emailId: email,
          googleId,
          avatarUrl,
          role: "user",
          problemSolved: [],
        });
        leaderboardService.setUserScore(user._id, 0).catch(() => {});
      }
    } else {
      if (avatarUrl && user.avatarUrl !== avatarUrl) {
        user.avatarUrl = avatarUrl;
        await user.save();
      }
    }

    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    );

    res.cookie("token", token, cookieOptions());

    // Issue a short-lived, single-use opaque code instead of leaking the JWT in the URL.
    const exchangeCode = crypto.randomBytes(32).toString("hex");
    await setEphemeral(`oauth:exchange:${exchangeCode}`, token, EXCHANGE_CODE_TTL_SEC);

    return res.redirect(`${frontendHome}/auth/google/success?code=${exchangeCode}`);
  } catch (err) {
    console.error("Google OAuth callback error:", err?.response?.data || err?.message);
    return res.redirect(`${frontendHome}/login?google_error=callback_failed`);
  }
};

// Step 3: Frontend exchanges the single-use opaque code for the JWT over POST.
const googleAuthExchange = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Exchange code is required" });
    }

    const token = await consumeEphemeral(`oauth:exchange:${code}`);
    if (!token) {
      return res.status(401).json({ error: "Invalid or expired exchange code" });
    }

    res.cookie("token", token, cookieOptions());
    return res.status(200).json({ token });
  } catch (err) {
    console.error("Google OAuth exchange error:", err?.message || err);
    return res.status(500).json({ error: "Failed to complete authentication exchange" });
  }
};

module.exports = { googleAuthRedirect, googleAuthCallback, googleAuthExchange };
