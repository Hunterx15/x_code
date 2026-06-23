const express = require('express');
const aiRouter =  express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const solveDoubt = require('../controllers/solveDoubt');
const { aiChatLimiter } = require('../middleware/rateLimiters');

aiRouter.post('/chat', userMiddleware, aiChatLimiter, solveDoubt);

module.exports = aiRouter;