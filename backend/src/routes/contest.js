const express = require("express");
const contestRouter = express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
  getAllContests,
  getContestById,
  registerForContest,
  unregisterFromContest,
  createContest,
} = require("../controllers/contestController");

// Contest endpoints — all require authenticated session
contestRouter.get("/all", userMiddleware, getAllContests);
contestRouter.get("/:contestId", userMiddleware, getContestById);
contestRouter.post("/register/:contestId", userMiddleware, registerForContest);
contestRouter.post("/unregister/:contestId", userMiddleware, unregisterFromContest);
contestRouter.post("/create", adminMiddleware, createContest);

module.exports = contestRouter;
