const express = require('express');
const submitRouter = express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const { submissionLimiter } = require("../middleware/rateLimiters");
const {
  submitCode,
  getSubmissionStatus,
  runCode,
} = require("../controllers/userSubmission");

submitRouter.post("/submit/:id", userMiddleware, submissionLimiter, submitCode);
submitRouter.get("/status/:submissionId", userMiddleware, getSubmissionStatus);
submitRouter.post("/run/:id", userMiddleware, submissionLimiter, runCode);

module.exports = submitRouter;
