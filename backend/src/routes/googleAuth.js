const express = require('express');

const googleRouter = express.Router();
const {
  googleAuthRedirect,
  googleAuthCallback,
  googleAuthExchange,
} = require('../controllers/googleAuth');
const { oauthLimiter } = require('../middleware/rateLimiters');

// GET  /user/auth/google          -> generate CSRF state, redirect to Google consent screen
// GET  /user/auth/google/callback -> verify state, exchange code, redirect with single-use opaque code
// POST /user/auth/google/exchange -> consume single-use code and return JWT
googleRouter.get('/auth/google', oauthLimiter, googleAuthRedirect);
googleRouter.get('/auth/google/callback', oauthLimiter, googleAuthCallback);
googleRouter.post('/auth/google/exchange', oauthLimiter, googleAuthExchange);

module.exports = googleRouter;
