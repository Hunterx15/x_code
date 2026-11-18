const mongoose = require("mongoose");
const Contest = require("../models/contest");
const ContestRegistration = require("../models/contestRegistration");
const Problem = require("../models/problem");
const Submission = require("../models/submission");
const User = require("../models/user");

// Derive real-time contest lifecycle state from timestamps
const computeContestStatus = (contest) => {
  const now = Date.now();
  const start = new Date(contest.startTime).getTime();
  const end = contest.endTime
    ? new Date(contest.endTime).getTime()
    : start + (contest.durationMinutes || 90) * 60 * 1000;

  if (now < start) return "upcoming";
  if (now <= end) return "live";
  return "ended";
};

const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Pick 4 balanced problems (1 Easy = 3pts, 2 Medium = 4/5pts, 1 Hard = 6pts)
const pickBalancedProblems = async (customIds = []) => {
  if (Array.isArray(customIds) && customIds.length > 0) {
    const validIds = customIds.filter((id) => mongoose.isValidObjectId(id));
    if (validIds.length > 0) {
      const docs = await Problem.find({ _id: { $in: validIds } })
        .select("_id difficulty")
        .lean();
      const ptsByDiff = { easy: 3, medium: 5, hard: 6 };
      return docs.map((d) => ({
        problemId: d._id,
        points: ptsByDiff[d.difficulty] || 4,
      }));
    }
  }

  const all = await Problem.find({}).select("_id difficulty").lean();
  if (all.length === 0) return [];

  const easy = shuffle(all.filter((p) => p.difficulty === "easy"));
  const med = shuffle(all.filter((p) => p.difficulty === "medium"));
  const hard = shuffle(all.filter((p) => p.difficulty === "hard"));

  const chosen = [];
  const usedIds = new Set();
  const addOne = (pool, points) => {
    const item = pool.find((p) => !usedIds.has(p._id.toString()));
    if (item) {
      usedIds.add(item._id.toString());
      chosen.push({ problemId: item._id, points });
    }
  };

  addOne(easy, 3);
  addOne(med, 4);
  addOne(med, 5);
  addOne(hard, 6);

  // Fill up to 4 from any remaining problems if catalog was sparse
  for (const p of shuffle(all)) {
    if (chosen.length >= 4) break;
    if (!usedIds.has(p._id.toString())) {
      usedIds.add(p._id.toString());
      chosen.push({ problemId: p._id, points: 4 });
    }
  }

  return chosen;
};

// Lazily backfill problems[] on older contest docs that were created without them
const ensureContestProblems = async (contestDoc) => {
  if (Array.isArray(contestDoc.problems) && contestDoc.problems.length > 0) {
    return contestDoc.problems;
  }
  const picked = await pickBalancedProblems();
  if (picked.length > 0) {
    await Contest.findByIdAndUpdate(contestDoc._id, {
      problems: picked,
      problemCount: picked.length,
    });
  }
  return picked;
};

// Ensure default contests exist (including one live/playable weekly sprint!)
const ensureDefaultContests = async () => {
  const count = await Contest.countDocuments();
  if (count > 0) return;

  const now = new Date();
  const defaults = [
    {
      title: "XCODE Live Open Round #1",
      type: "weekly",
      durationMinutes: 120,
      offsetHours: -0.1, // Live right now so users can enter immediately!
      badge: "Live Rated",
      difficulty: "1 Easy · 2 Medium · 1 Hard",
      description:
        "Live open tournament! Jump straight into the arena, solve 4 balanced DSA challenges, and climb the live scoreboard.",
    },
    {
      title: "Weekly Contest 431",
      type: "weekly",
      durationMinutes: 90,
      offsetHours: 48,
      badge: "Rated",
      difficulty: "1 Easy · 2 Medium · 1 Hard",
      description:
        "Compete against programmers worldwide in 4 timed algorithmic challenges.",
    },
    {
      title: "Biweekly Contest 148",
      type: "biweekly",
      durationMinutes: 90,
      offsetHours: 144,
      badge: "Rated",
      difficulty: "1 Easy · 2 Medium · 1 Hard",
      description: "Fast-paced biweekly contest rated for all divisions.",
    },
    {
      title: "XCODE Spring Cup 2026",
      type: "championship",
      durationMinutes: 120,
      offsetHours: 336,
      badge: "Grand Prize",
      difficulty: "1 Medium · 2 Hard · 1 Expert",
      description:
        "Annual Spring Championship with rating multipliers and special badges.",
    },
  ];

  const docs = [];
  for (const item of defaults) {
    const startTime = new Date(now.getTime() + item.offsetHours * 3600 * 1000);
    const endTime = new Date(
      startTime.getTime() + item.durationMinutes * 60 * 1000
    );
    const problems = await pickBalancedProblems();
    docs.push({
      title: item.title,
      type: item.type,
      durationMinutes: item.durationMinutes,
      startTime,
      endTime,
      badge: item.badge,
      difficulty: item.difficulty,
      description: item.description,
      problems,
      problemCount: problems.length || 4,
      status: computeContestStatus({ startTime, endTime }),
      participantCount: 0,
    });
  }

  await Contest.insertMany(docs);
};

// ---------------------------------------------------------------------------
// GET /contest/all
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

    const formatted = contests.map((c) => {
      const liveStatus = computeContestStatus(c);
      const endTime =
        c.endTime ||
        new Date(
          new Date(c.startTime).getTime() + (c.durationMinutes || 90) * 60 * 1000
        );
      return {
        _id: c._id,
        id: c._id.toString(),
        title: c.title,
        description: c.description,
        startTime: c.startTime,
        endTime,
        durationMinutes: c.durationMinutes,
        type: c.type,
        badge: c.badge,
        difficulty: c.difficulty,
        problemCount:
          (Array.isArray(c.problems) && c.problems.length) ||
          c.problemCount ||
          4,
        status: liveStatus,
        registeredCount: c.participantCount || 0,
        isRegistered: registeredSet.has(c._id.toString()),
      };
    });

    // Sort live contests first, then upcoming, then ended
    const order = { live: 0, upcoming: 1, ended: 2 };
    formatted.sort(
      (a, b) =>
        order[a.status] - order[b.status] ||
        new Date(a.startTime) - new Date(b.startTime)
    );

    res.status(200).json({ contests: formatted });
  } catch (err) {
    console.error("getAllContests error:", err);
    res.status(500).json({ error: "Failed to fetch contests" });
  }
};

// ---------------------------------------------------------------------------
// GET /contest/:contestId/arena?virtual=false
// Full playable contest room: timer, 4 problems with points, and user's solves
// ---------------------------------------------------------------------------
const getContestArena = async (req, res) => {
  try {
    const { contestId } = req.params;
    const isVirtual = req.query.virtual === "true";
    const userId = req.result._id;

    if (!mongoose.isValidObjectId(contestId)) {
      return res.status(400).json({ error: "Invalid contest ID" });
    }

    const contest = await Contest.findById(contestId).lean();
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    const liveStatus = computeContestStatus(contest);
    const endTime =
      contest.endTime ||
      new Date(
        new Date(contest.startTime).getTime() +
          (contest.durationMinutes || 90) * 60 * 1000
      );

    // Ensure registration exists if user enters a live contest
    const isRegistered = Boolean(
      await ContestRegistration.exists({ contestId, userId })
    );

    // Lock problems if strictly upcoming and NOT virtual practice mode
    if (liveStatus === "upcoming" && !isVirtual) {
      return res.status(200).json({
        contest: {
          _id: contest._id,
          title: contest.title,
          description: contest.description,
          startTime: contest.startTime,
          endTime,
          durationMinutes: contest.durationMinutes,
          status: liveStatus,
          badge: contest.badge,
          registeredCount: contest.participantCount || 0,
          isRegistered,
        },
        locked: true,
        isVirtual: false,
        problems: [],
      });
    }

    const problemEntries = await ensureContestProblems(contest);
    const problemIds = problemEntries.map((p) => p.problemId);

    const [problemDocs, userSubs] = await Promise.all([
      Problem.find({ _id: { $in: problemIds } })
        .select("_id title difficulty tags")
        .lean(),
      Submission.find({
        userId,
        problemId: { $in: problemIds },
      })
        .select("problemId status createdAt")
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    const docMap = new Map(problemDocs.map((d) => [d._id.toString(), d]));

    // Summarize user's progress on each contest problem
    const statusByProblem = new Map();
    for (const s of userSubs) {
      const pid = s.problemId.toString();
      const entry = statusByProblem.get(pid) || {
        solved: false,
        attempts: 0,
        wrongBeforeAC: 0,
      };
      entry.attempts++;
      if (!entry.solved) {
        if (s.status === "accepted") {
          entry.solved = true;
        } else if (s.status !== "pending") {
          entry.wrongBeforeAC++;
        }
      }
      statusByProblem.set(pid, entry);
    }

    const problems = problemEntries
      .map((entry, idx) => {
        const pid = entry.problemId.toString();
        const doc = docMap.get(pid);
        if (!doc) return null;
        const progress = statusByProblem.get(pid) || {
          solved: false,
          attempts: 0,
          wrongBeforeAC: 0,
        };
        return {
          index: idx + 1,
          label: `Q${idx + 1}`,
          _id: doc._id,
          title: doc.title,
          difficulty: doc.difficulty,
          tags: doc.tags,
          points: entry.points || 4,
          solved: progress.solved,
          attempts: progress.attempts,
          wrongBeforeAC: progress.wrongBeforeAC,
        };
      })
      .filter(Boolean);

    const userScore = problems.reduce(
      (sum, p) => sum + (p.solved ? p.points : 0),
      0
    );
    const maxScore = problems.reduce((sum, p) => sum + p.points, 0);

    return res.status(200).json({
      contest: {
        _id: contest._id,
        title: contest.title,
        description: contest.description,
        startTime: contest.startTime,
        endTime,
        durationMinutes: contest.durationMinutes,
        status: liveStatus,
        badge: contest.badge,
        registeredCount: contest.participantCount || 0,
        isRegistered,
      },
      locked: false,
      isVirtual,
      userScore,
      maxScore,
      problems,
    });
  } catch (err) {
    console.error("getContestArena error:", err);
    res.status(500).json({ error: "Failed to load contest arena" });
  }
};

// ---------------------------------------------------------------------------
// GET /contest/:contestId/leaderboard
// Computes real contest standings (Total Points DESC, Penalty Minutes ASC)
// ---------------------------------------------------------------------------
const getContestLeaderboard = async (req, res) => {
  try {
    const { contestId } = req.params;
    if (!mongoose.isValidObjectId(contestId)) {
      return res.status(400).json({ error: "Invalid contest ID" });
    }

    const contest = await Contest.findById(contestId).lean();
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    const problemEntries = await ensureContestProblems(contest);
    const problemIds = problemEntries.map((p) => p.problemId);
    const pointsMap = new Map(
      problemEntries.map((p) => [p.problemId.toString(), p.points || 4])
    );

    const startMs = new Date(contest.startTime).getTime();
    const endMs = contest.endTime
      ? new Date(contest.endTime).getTime()
      : startMs + (contest.durationMinutes || 90) * 60 * 1000;

    // Pull submissions for the contest's problems
    const subs = await Submission.find({
      problemId: { $in: problemIds },
      status: { $in: ["accepted", "wrong", "error"] },
    })
      .select("userId problemId status createdAt")
      .sort({ createdAt: 1 })
      .lean();

    const byUser = new Map();
    for (const s of subs) {
      const uid = s.userId.toString();
      const pid = s.problemId.toString();
      if (!byUser.has(uid)) {
        byUser.set(uid, new Map());
      }
      const pMap = byUser.get(uid);
      const cell = pMap.get(pid) || {
        solved: false,
        wrongCount: 0,
        solveMinute: null,
      };
      if (!cell.solved) {
        if (s.status === "accepted") {
          cell.solved = true;
          const subMs = new Date(s.createdAt).getTime();
          const mins = Math.max(
            1,
            Math.round(Math.abs(subMs - startMs) / 60000)
          );
          cell.solveMinute = Math.min(mins, contest.durationMinutes || 90);
        } else {
          cell.wrongCount++;
        }
      }
      pMap.set(pid, cell);
    }

    const userIds = [...byUser.keys()].map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    const users =
      userIds.length > 0
        ? await User.find({ _id: { $in: userIds } })
            .select("_id firstName lastName avatarUrl")
            .lean()
        : [];
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const standings = [];
    for (const [uid, pMap] of byUser.entries()) {
      const u = userMap.get(uid);
      if (!u) continue;

      let totalScore = 0;
      let solvedCount = 0;
      let maxSolveMin = 0;
      let totalWrongOnSolved = 0;

      const problemResults = problemIds.map((pidObj) => {
        const pid = pidObj.toString();
        const cell = pMap.get(pid);
        if (!cell) return { problemId: pid, status: "unattempted", wrongCount: 0 };
        if (cell.solved) {
          totalScore += pointsMap.get(pid) || 4;
          solvedCount++;
          maxSolveMin = Math.max(maxSolveMin, cell.solveMinute || 1);
          totalWrongOnSolved += cell.wrongCount;
          return {
            problemId: pid,
            status: "accepted",
            solveMinute: cell.solveMinute,
            wrongCount: cell.wrongCount,
          };
        }
        return {
          problemId: pid,
          status: "wrong",
          wrongCount: cell.wrongCount,
        };
      });

      const penaltyMinutes = maxSolveMin + totalWrongOnSolved * 5;
      standings.push({
        userId: u._id,
        firstName: u.firstName,
        lastName: u.lastName || "",
        avatarUrl: u.avatarUrl || null,
        totalScore,
        solvedCount,
        penaltyMinutes,
        problemResults,
      });
    }

    standings.sort(
      (a, b) =>
        b.totalScore - a.totalScore ||
        a.penaltyMinutes - b.penaltyMinutes ||
        b.solvedCount - a.solvedCount
    );

    const ranked = standings.map((row, idx) => ({
      rank: idx + 1,
      ...row,
    }));

    return res.status(200).json({
      contestId,
      standings: ranked,
      totalParticipants: ranked.length,
    });
  } catch (err) {
    console.error("getContestLeaderboard error:", err);
    res.status(500).json({ error: "Failed to load contest standings" });
  }
};

// ---------------------------------------------------------------------------
// GET /contest/:contestId
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
        status: computeContestStatus(contest),
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
// POST /contest/host (Any authenticated user) & POST /contest/create (Admin)
// Host a live or scheduled contest with real problems from MongoDB
// ---------------------------------------------------------------------------
const hostContest = async (req, res) => {
  try {
    const {
      title,
      description,
      startTime,
      startNow = true,
      durationMinutes = 90,
      type,
      badge,
      problemIds = [],
    } = req.body;

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return res
        .status(400)
        .json({ error: "Contest title must be at least 3 characters" });
    }

    const duration = Math.min(Math.max(parseInt(durationMinutes, 10) || 90, 15), 240);
    const start =
      startNow || !startTime ? new Date(Date.now() - 5000) : new Date(startTime);
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ error: "Invalid startTime" });
    }
    const end = new Date(start.getTime() + duration * 60 * 1000);

    const problems = await pickBalancedProblems(problemIds);
    const isAdmin = req.result?.role === "admin";

    const contest = await Contest.create({
      title: title.trim().slice(0, 100),
      description:
        description?.trim() ||
        `Hosted by ${req.result.firstName}. Solve ${problems.length || 4} timed DSA challenges.`,
      startTime: start,
      endTime: end,
      durationMinutes: duration,
      type: type || (isAdmin ? "weekly" : "community"),
      badge: badge || (isAdmin ? "Rated" : "Hosted"),
      difficulty: `${problems.length || 4} Curated Challenges`,
      problems,
      problemCount: problems.length || 4,
      status: computeContestStatus({ startTime: start, endTime: end }),
      createdBy: req.result._id,
      participantCount: 1,
    });

    // Auto-register the host
    await ContestRegistration.create({
      contestId: contest._id,
      userId: req.result._id,
    }).catch(() => {});

    res.status(201).json({
      message: "Contest hosted successfully",
      contest: {
        _id: contest._id,
        id: contest._id.toString(),
        title: contest.title,
        startTime: contest.startTime,
        endTime: contest.endTime,
        durationMinutes: contest.durationMinutes,
        status: computeContestStatus(contest),
        registeredCount: 1,
        isRegistered: true,
        problemCount: problems.length,
      },
    });
  } catch (err) {
    console.error("hostContest error:", err);
    res.status(500).json({ error: "Failed to host contest" });
  }
};

module.exports = {
  ensureDefaultContests,
  getAllContests,
  getContestById,
  getContestArena,
  getContestLeaderboard,
  registerForContest,
  unregisterFromContest,
  hostContest,
  createContest: hostContest,
};
