const express = require('express');

const googleRouter = express.Router();
const { googleAuthRedirect, googleAuthCallback } = require('../controllers/googleAuth');
const { oauthLimiter } = require('../middleware/rateLimiters');

// GET /user/auth/google         -> redirect to Google consent screen
// GET /user/auth/google/callback -> exchange code, set JWT cookie, redirect to frontend
//
// NOTE: these routes are intentionally NOT behind userMiddleware — they are the
// entry points that ESTABLISH the session. The callback issues the same JWT
// cookie that userMiddleware later verifies on subsequent requests.
googleRouter.get('/auth/google', oauthLimiter, googleAuthRedirect);
googleRouter.get('/auth/google/callback', oauthLimiter, googleAuthCallback);

module.exports = googleRouter;
