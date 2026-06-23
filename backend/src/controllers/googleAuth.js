const axios = require("axios");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { cookieOptions } = require("../config/cookieConfig");

// ---------------------------------------------------------------------------
// Google OAuth 2.0 Authorization Code flow (no passport, no extra deps).
//
// Endpoints (mounted at /user/auth/google):
//   GET  /user/auth/google           -> redirect browser to Google consent
//   GET  /user/auth/google/callback  -> exchange code, link/create user, set JWT cookie, redirect to frontend
//
// Existing email/password users are linked by email: if a user with the same
// emailId already exists and has no googleId, we set googleId + avatarUrl on
// that existing user (so they can later sign in with EITHER method).
// ---------------------------------------------------------------------------

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

const buildRedirectUri = () => {
  // Bug #5 fix: NEVER derive the redirect URI from request headers.
  // An attacker who can reach the backend directly can set X-Forwarded-Host
  // to evil.com, causing Google to send the authorization code to the
  // attacker's server (OAuth account takeover). Always require the env var.
  if (!process.env.GOOGLE_REDIRECT_URI) {
    throw new Error("GOOGLE_REDIRECT_URI environment variable is required");
  }
  return process.env.GOOGLE_REDIRECT_URI;
};

const buildFrontendHomeUrl = () => {
  // Bug #5 fix: same — never derive from request headers.
  if (!process.env.CLIENT_URL) {
    throw new Error("CLIENT_URL environment variable is required");
  }
  return process.env.CLIENT_URL;
};

// Step 1: redirect user to Google's consent screen.
const googleAuthRedirect = (req, res) => {
  const redirectUri = buildRedirectUri();
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });
  return res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
};

// Step 2: Google redirects back here with ?code=...
const googleAuthCallback = async (req, res) => {
  const frontendHome = buildFrontendHomeUrl();
  const redirectUri = buildRedirectUri();

  const { code } = req.query;
  if (!code) {
    return res.redirect(`${frontendHome}/login?google_error=missing_code`);
  }

  try {
    // Exchange authorization code for access token.
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
    // Bug #17 fix: require accessToken specifically (not idToken).
    // The userinfo endpoint needs a Bearer access_token; idToken alone
    // can't be used to fetch the profile here.
    if (!accessToken) {
      return res.redirect(`${frontendHome}/login?google_error=no_token`);
    }

    // Fetch the user's Google profile (sub, email, name, picture).
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

    // Resolve the user: link by googleId first, then by email, then create.
    let user = await User.findOne({ googleId });

    if (!user) {
      // Try linking to an existing email/password account.
      user = await User.findOne({ emailId: email });
      if (user) {
        // Existing email/password user — attach Google identity.
        user.googleId = googleId;
        user.avatarUrl = avatarUrl;
        await user.save();
      } else {
        // Brand new Google user. Derive a firstName from the Google display name.
        const firstName = name.split(" ")[0] || "GoogleUser";
        user = await User.create({
          firstName,
          emailId: email,
          googleId,
          avatarUrl,
          role: "user",
          // password intentionally omitted — schema's conditional `required`
          // evaluates to false because googleId is truthy.
        });
      }
    } else {
      // Existing Google user — refresh avatar if it changed.
      if (avatarUrl && user.avatarUrl !== avatarUrl) {
        user.avatarUrl = avatarUrl;
        await user.save();
      }
    }

    // Issue the SAME JWT cookie that email/password login uses, so
    // userMiddleware / adminMiddleware work unchanged.
    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    );

    res.cookie("token", token, cookieOptions());

    // Redirect back to the frontend. The frontend's /auth/google/success route
    // will call /user/check to hydrate Redux and then navigate to "/".
    return res.redirect(`${frontendHome}/auth/google/success`);
  } catch (err) {
    console.error("Google OAuth callback error:", err?.response?.data || err?.message);
    return res.redirect(`${frontendHome}/login?google_error=callback_failed`);
  }
};

module.exports = { googleAuthRedirect, googleAuthCallback };
