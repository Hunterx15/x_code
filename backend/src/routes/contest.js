const express = require("express");
const contestRouter = express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
  getAllContests,
  getContestById,
  getContestArena,
  getContestLeaderboard,
  registerForContest,
  unregisterFromContest,
  hostContest,
  createContest,
} = require("../controllers/contestController");

// Contest endpoints — all require authenticated session
contestRouter.get("/all", userMiddleware, getAllContests);
contestRouter.post("/host", userMiddleware, hostContest);
contestRouter.post("/create", adminMiddleware, createContest);
contestRouter.get("/:contestId/arena", userMiddleware, getContestArena);
contestRouter.get("/:contestId/leaderboard", userMiddleware, getContestLeaderboard);
contestRouter.get("/:contestId", userMiddleware, getContestById);
contestRouter.post("/register/:contestId", userMiddleware, registerForContest);
contestRouter.post("/unregister/:contestId", userMiddleware, unregisterFromContest);

module.exports = contestRouter;
