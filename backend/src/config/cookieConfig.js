// ---------------------------------------------------------------------------
// Centralized cookie configuration for the JWT auth cookie.
//
// Reads from environment variables so local dev (HTTP) and production (HTTPS,
// cross-site) can use different policies without code changes.
//
//   COOKIE_SECURE   — 'true' to set the Secure flag (HTTPS only). Default: false.
//   COOKIE_SAMESITE — 'none' | 'lax' | 'strict'. Default: 'lax'.
//   COOKIE_MAX_AGE  — cookie lifetime in milliseconds. Default: 3600000 (1h).
//
// Notes:
//   - When COOKIE_SAMESITE='none', COOKIE_SECURE MUST be 'true' (modern
//     browsers reject SameSite=None cookies without Secure). The helper
//     enforces this by upgrading secure to true in that case.
//   - The JWT itself still expires after 1h (hardcoded in userAuthent.js and
//     googleAuth.js as expiresIn: 60 * 60). Keep COOKIE_MAX_AGE >= 3600000
//     so the cookie doesn't disappear before the token.
// ---------------------------------------------------------------------------

const cookieOptions = () => {
  const sameSite = process.env.COOKIE_SAMESITE || 'lax';
  let secure = process.env.COOKIE_SECURE === 'true';

  // SameSite=None requires Secure; modern browsers reject otherwise.
  if (sameSite === 'none' && !secure) {
    secure = true;
  }

  const maxAge = Number(process.env.COOKIE_MAX_AGE) || 60 * 60 * 1000;

  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge,
  };
};

// Options for the logout "clear" cookie. Same policy as cookieOptions() but
// with an immediate expiry so the browser deletes it.
const clearCookieOptions = () => {
  const base = cookieOptions();
  return {
    httpOnly: base.httpOnly,
    secure: base.secure,
    sameSite: base.sameSite,
    expires: new Date(0),
  };
};

module.exports = { cookieOptions, clearCookieOptions };
