const mongoose = require("mongoose");
const Contest = require("../models/contest");
const ContestRegistration = require("../models/contestRegistration");

// Ensure default upcoming contests exist so the platform is never empty
const ensureDefaultContests = async () => {
  const count = await Contest.countDocuments();
  if (count > 0) return;

  const now = new Date();
  const defaults = [
    {
      title: "Weekly Contest 431",
      type: "weekly",
      durationMinutes: 90,
      daysOffset: 2,
      badge: "Rated",
      difficulty: "1 Easy · 2 Medium · 1 Hard",
      description:
        "Compete against thousands of programmers in 4 algorithmic challenges.",
    },
    {
      title: "Biweekly Contest 148",
      type: "biweekly",
      durationMinutes: 90,
      daysOffset: 6,
      badge: "Rated",
      difficulty: "1 Easy · 2 Medium · 1 Hard",
      description: "Fast-paced biweekly contest rated for all divisions.",
    },
    {
      title: "Weekly Contest 432",
      type: "weekly",
      durationMinutes: 90,
      daysOffset: 9,
      badge: "Rated",
      difficulty: "1 Easy · 2 Medium · 1 Hard",
      description: "Standard weekly rated contest for DSA mastery.",
    },
    {
      title: "XCODE Spring Cup 2026",
      type: "championship",
      durationMinutes: 120,
      daysOffset: 14,
      badge: "Grand Prize",
      difficulty: "1 Medium · 2 Hard · 1 Expert",
      description:
        "Annual Spring Championship with rating multipliers and badges.",
    },
  ];

  const docs = defaults.map((item) => {
    const startTime = new Date(now);
    startTime.setUTCDate(startTime.getUTCDate() + item.daysOffset);
    startTime.setUTCHours(10, 0, 0, 0);

    const endTime = new Date(
      startTime.getTime() + item.durationMinutes * 60 * 1000
    );

    return {
      title: item.title,
      type: item.type,
      durationMinutes: item.durationMinutes,
      startTime,
      endTime,
      badge: item.badge,
      difficulty: item.difficulty,
      description: item.description,
      status: "upcoming",
      participantCount: 0,
    };
  });

  await Contest.insertMany(docs);
};

// ---------------------------------------------------------------------------
// GET /contest/all
// Returns all upcoming & active contests with user registration state
// ---------------------------------------------------------------------------
const getAllContests = async (req, res) => {
  try {
    await ensureDefaultContests();

    const userId = req.result?._id;
    const contests = await Contest.find({}).sort({ startTime: 1 }).lean();

    let registeredSet = new Set();
    if (userId && contests.length > 0) {
      const contestIds = contests.map((c) => c._id);
      const regs = await ContestRegistration.find({
        userId,
        contestId: { $in: contestIds },
      })
        .select("contestId")
        .lean();
      registeredSet = new Set(regs.map((r) => r.contestId.toString()));
    }

    const formatted = contests.map((c) => ({
      _id: c._id,
      id: c._id.toString(),
      title: c.title,
      description: c.description,
      startTime: c.startTime,
      endTime: c.endTime,
      durationMinutes: c.durationMinutes,
      type: c.type,
      badge: c.badge,
      difficulty: c.difficulty,
      problemCount: c.problemCount || 4,
      status: c.status,
      registeredCount: c.participantCount || 0,
      isRegistered: registeredSet.has(c._id.toString()),
    }));

    res.status(200).json({ contests: formatted });
  } catch (err) {
    console.error("getAllContests error:", err);
    res.status(500).json({ error: "Failed to fetch contests" });
  }
};

// ---------------------------------------------------------------------------
// GET /contest/:contestId
// Fetches specific contest
// ---------------------------------------------------------------------------
const getContestById = async (req, res) => {
  try {
    const { contestId } = req.params;
    if (!mongoose.isValidObjectId(contestId)) {
      return res.status(400).json({ error: "Invalid contest ID" });
    }

    const userId = req.result?._id;
    const [contest, existingReg] = await Promise.all([
      Contest.findById(contestId).lean(),
      userId
        ? ContestRegistration.exists({ contestId, userId })
        : Promise.resolve(null),
    ]);

    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    res.status(200).json({
      contest: {
        _id: contest._id,
        id: contest._id.toString(),
        title: contest.title,
        description: contest.description,
        startTime: contest.startTime,
        endTime: contest.endTime,
        durationMinutes: contest.durationMinutes,
        type: contest.type,
        badge: contest.badge,
        difficulty: contest.difficulty,
        problemCount: contest.problemCount || 4,
        status: contest.status,
        registeredCount: contest.participantCount || 0,
        isRegistered: Boolean(existingReg),
      },
    });
  } catch (err) {
    console.error("getContestById error:", err);
    res.status(500).json({ error: "Failed to fetch contest" });
  }
};

// ---------------------------------------------------------------------------
// POST /contest/register/:contestId
// Idempotently registers the authenticated user via ContestRegistration
// ---------------------------------------------------------------------------
const registerForContest = async (req, res) => {
  try {
    const { contestId } = req.params;
    const userId = req.result._id;

    if (!mongoose.isValidObjectId(contestId)) {
      return res.status(400).json({ error: "Invalid contest ID" });
    }

    const contestExists = await Contest.exists({ _id: contestId });
    if (!contestExists) {
      return res.status(404).json({ error: "Contest not found" });
    }

    let updatedContest = null;
    try {
      await ContestRegistration.create({ contestId, userId });
      updatedContest = await Contest.findByIdAndUpdate(
        contestId,
        { $inc: { participantCount: 1 } },
        { new: true }
      ).select("participantCount");
    } catch (err) {
      if (err?.code === 11000) {
        // Already registered — idempotent success without double-incrementing
        updatedContest = await Contest.findById(contestId).select(
          "participantCount"
        );
      } else {
        throw err;
      }
    }

    res.status(200).json({
      message: "Successfully registered for contest",
      isRegistered: true,
      registeredCount: updatedContest?.participantCount || 0,
    });
  } catch (err) {
    console.error("registerForContest error:", err);
    res.status(500).json({ error: "Failed to register for contest" });
  }
};

// ---------------------------------------------------------------------------
// POST /contest/unregister/:contestId
// Atomically removes registration and decrements participantCount
// ---------------------------------------------------------------------------
const unregisterFromContest = async (req, res) => {
  try {
    const { contestId } = req.params;
    const userId = req.result._id;

    if (!mongoose.isValidObjectId(contestId)) {
      return res.status(400).json({ error: "Invalid contest ID" });
    }

    const contestExists = await Contest.exists({ _id: contestId });
    if (!contestExists) {
      return res.status(404).json({ error: "Contest not found" });
    }

    const deleted = await ContestRegistration.findOneAndDelete({
      contestId,
      userId,
    });

    let updatedContest;
    if (deleted) {
      updatedContest = await Contest.findOneAndUpdate(
        { _id: contestId, participantCount: { $gt: 0 } },
        { $inc: { participantCount: -1 } },
        { new: true }
      ).select("participantCount");
    }
    if (!updatedContest) {
      updatedContest = await Contest.findById(contestId).select(
        "participantCount"
      );
    }

    res.status(200).json({
      message: "Successfully unregistered from contest",
      isRegistered: false,
      registeredCount: updatedContest?.participantCount || 0,
    });
  } catch (err) {
    console.error("unregisterFromContest error:", err);
    res.status(500).json({ error: "Failed to unregister from contest" });
  }
};

// ---------------------------------------------------------------------------
// POST /contest/create (Admin only)
// ---------------------------------------------------------------------------
const createContest = async (req, res) => {
  try {
    const {
      title,
      description,
      startTime,
      durationMinutes,
      type,
      badge,
      difficulty,
    } = req.body;

    if (!title || !startTime) {
      return res
        .status(400)
        .json({ error: "Title and startTime are required" });
    }

    const duration = parseInt(durationMinutes, 10) || 90;
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60 * 1000);

    const contest = await Contest.create({
      title,
      description,
      startTime: start,
      endTime: end,
      durationMinutes: duration,
      type: type || "weekly",
      badge: badge || "Rated",
      difficulty: difficulty || "1 Easy · 2 Medium · 1 Hard",
      createdBy: req.result._id,
      participantCount: 0,
    });

    res.status(201).json({
      message: "Contest created successfully",
      contest,
    });
  } catch (err) {
    console.error("createContest error:", err);
    res.status(500).json({ error: "Failed to create contest" });
  }
};

module.exports = {
  ensureDefaultContests,
  getAllContests,
  getContestById,
  registerForContest,
  unregisterFromContest,
  createContest,
};
