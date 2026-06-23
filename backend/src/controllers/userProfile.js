// ---------------------------------------------------------------------------
// User profile + dashboard controller (Batch F + G).
//
// Computes all profile/dashboard statistics from EXISTING data:
//   - User.problemSolved (array of solved problem ObjectIds)
//   - Submission collection (status, runtime, memory, createdAt, etc.)
//   - Problem collection (difficulty, tags)
//
// NO schema changes. NO new collections. NO modifications to existing APIs.
// Three new GET endpoints (all behind userMiddleware):
//   GET /user/profile       -> full profile stats + activity graph + recent submissions
//   GET /user/submissions   -> paginated global submission history
//   GET /user/dashboard     -> daily challenge + recommended + recent + stats + activity + contests
// ---------------------------------------------------------------------------

const User = require("../models/user");
const Problem = require("../models/problem");
const Submission = require("../models/submission");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Format a Date as 'YYYY-MM-DD' in UTC (matches MongoDB $dateToString default).
const formatUTCDate = (date) => {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Compute current solving streak.
// A "streak day" is a UTC day with at least one accepted submission.
// The streak is the count of consecutive streak days ending today OR yesterday
// (so the streak doesn't break until a full UTC day passes with no accepted).
const computeStreak = (acceptedDateStrings) => {
  const acceptedSet = new Set(acceptedDateStrings);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // If today has no accepted submission, start the cursor from yesterday.
  // (gives users until end of UTC day to keep their streak alive)
  const todayStr = formatUTCDate(today);
  let cursor = new Date(today);
  if (!acceptedSet.has(todayStr)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  // Cap at 10 years to avoid infinite loop on bad data.
  for (let i = 0; i < 3650; i++) {
    const dateStr = formatUTCDate(cursor);
    if (acceptedSet.has(dateStr)) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

// ---------------------------------------------------------------------------
// Shared profile-stats computation.
//
// Returns: { user, stats, activityGraph, recentSubmissions }
// Used by both /user/profile and /user/dashboard so the two endpoints never
// diverge on how stats are calculated.
// ---------------------------------------------------------------------------
const computeProfileStats = async (userId, { recentLimit = 10, activityDays = 90 } = {}) => {
  // 1. User + populated problemSolved (for difficulty breakdown)
  const user = await User.findById(userId).populate({
    path: "problemSolved",
    select: "_id title difficulty tags",
  });

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  // 2. Difficulty breakdown of solved problems
  const difficultyBreakdown = { easy: 0, medium: 0, hard: 0 };
  user.problemSolved.forEach((p) => {
    const d = p.difficulty;
    if (difficultyBreakdown[d] !== undefined) difficultyBreakdown[d]++;
  });

  // 3. Total + accepted submission counts (single aggregation)
  const submissionStats = await Submission.aggregate([
    { $match: { userId: user._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        accepted: {
          $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
        },
      },
    },
  ]);
  const totalSubmissions = submissionStats[0]?.total || 0;
  const acceptedSubmissions = submissionStats[0]?.accepted || 0;
  const acceptanceRate =
    totalSubmissions > 0
      ? Math.round((acceptedSubmissions / totalSubmissions) * 1000) / 10
      : 0;

  // 4. Recent submissions (newest first)
  const recentSubmissions = await Submission.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(recentLimit)
    .populate("problemId", "title difficulty tags")
    .select(
      "status language runtime memory testCasesPassed testCasesTotal createdAt problemId"
    );

  // 5. Activity graph (last N days, submissions + accepted per UTC day)
  const sinceDate = new Date();
  sinceDate.setUTCDate(sinceDate.getUTCDate() - (activityDays - 1));
  sinceDate.setUTCHours(0, 0, 0, 0);

  const activityRaw = await Submission.aggregate([
    { $match: { userId: user._id, createdAt: { $gte: sinceDate } } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        submissions: { $sum: 1 },
        accepted: {
          $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Build a complete date bucket so the frontend always gets N entries
  // (fill missing days with zeros — gives a continuous heatmap).
  const activityMap = new Map(
    activityRaw.map((a) => [a._id, { submissions: a.submissions, accepted: a.accepted }])
  );
  const activityGraph = [];
  const cursor = new Date(sinceDate);
  for (let i = 0; i < activityDays; i++) {
    const dateStr = formatUTCDate(cursor);
    const entry = activityMap.get(dateStr) || { submissions: 0, accepted: 0 };
    activityGraph.push({
      date: dateStr,
      submissions: entry.submissions,
      accepted: entry.accepted,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // 6. Streak — distinct UTC days with at least one accepted submission.
  // Uses the full submission history (not just last 90 days) so long-running
  // streaks aren't artificially capped.
  const acceptedDaysAgg = await Submission.aggregate([
    { $match: { userId: user._id, status: "accepted" } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
      },
    },
  ]);
  const streak = computeStreak(acceptedDaysAgg.map((d) => d._id));

  return {
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName || null,
      emailId: user.emailId,
      avatarUrl: user.avatarUrl || null,
      role: user.role,
    },
    stats: {
      totalSolved: user.problemSolved.length,
      easy: difficultyBreakdown.easy,
      medium: difficultyBreakdown.medium,
      hard: difficultyBreakdown.hard,
      totalSubmissions,
      acceptedSubmissions,
      acceptanceRate,
      streak,
    },
    activityGraph,
    recentSubmissions: recentSubmissions.map((s) => ({
      _id: s._id,
      problemId: s.problemId?._id || null,
      problemTitle: s.problemId?.title || null,
      difficulty: s.problemId?.difficulty || null,
      tags: s.problemId?.tags || null,
      status: s.status,
      language: s.language,
      runtime: s.runtime,
      memory: s.memory,
      testCasesPassed: s.testCasesPassed,
      testCasesTotal: s.testCasesTotal,
      createdAt: s.createdAt,
    })),
  };
};

// ---------------------------------------------------------------------------
// GET /user/profile
// ---------------------------------------------------------------------------
const getProfile = async (req, res) => {
  try {
    const data = await computeProfileStats(req.result._id, {
      recentLimit: 10,
      activityDays: 90,
    });
    res.status(200).json(data);
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: "User not found" });
    }
    console.error("Profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// GET /user/submissions?page=1&limit=20
// Paginated global submission history (the existing /problem/submittedProblem/:pid
// is per-problem; this is the user-wide view).
// ---------------------------------------------------------------------------
const getSubmissionHistory = async (req, res) => {
  try {
    const userId = req.result._id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      Submission.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("problemId", "title difficulty tags")
        .select(
          "status language runtime memory testCasesPassed testCasesTotal createdAt problemId"
        ),
      Submission.countDocuments({ userId }),
    ]);

    res.status(200).json({
      submissions: submissions.map((s) => ({
        _id: s._id,
        problemId: s.problemId?._id || null,
        problemTitle: s.problemId?.title || null,
        difficulty: s.problemId?.difficulty || null,
        tags: s.problemId?.tags || null,
        status: s.status,
        language: s.language,
        runtime: s.runtime,
        memory: s.memory,
        testCasesPassed: s.testCasesPassed,
        testCasesTotal: s.testCasesTotal,
        createdAt: s.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Submission history error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// GET /user/dashboard
// Reuses computeProfileStats so the dashboard never diverges from the profile.
// Adds: daily challenge, recommended (unsolved) problems, upcoming contests.
// ---------------------------------------------------------------------------
const getDashboard = async (req, res) => {
  try {
    const userId = req.result._id;

    // Run profile stats + problem list in parallel.
    const [profileData, allProblems] = await Promise.all([
      computeProfileStats(userId, { recentLimit: 5, activityDays: 90 }),
      Problem.find({}).select("_id title difficulty tags"),
    ]);

    // Daily challenge: deterministic by day-of-year so every user sees the
    // same problem on a given day. Rotates through the full problem set.
    let dailyChallenge = null;
    if (allProblems.length > 0) {
      const today = new Date();
      const startOfYear = new Date(Date.UTC(today.getUTCFullYear(), 0, 0));
      const dayOfYear = Math.floor(
        (today - startOfYear) / (1000 * 60 * 60 * 24)
      );
      dailyChallenge = allProblems[dayOfYear % allProblems.length];
    }

    // Recommended: unsolved problems (limit 5). If user has solved everything,
    // fall back to the 5 most-recently-added problems.
    const solvedIds = new Set(
      profileData.recentSubmissions
        .map((s) => s.problemId?.toString())
        .filter(Boolean)
    );
    // We need the full solved list — profileData.stats.totalSolved counts it
    // but we don't have the IDs from computeProfileStats. Re-fetch the user's
    // problemSolved array (cheap, single indexed query).
    const userDoc = await User.findById(userId).select("problemSolved");
    // Bug #33 fix: null-check userDoc — if the user was deleted between
    // middleware and this call, userDoc is null and userDoc.problemSolved throws.
    if (!userDoc) {
      return res.status(404).json({ error: "User not found" });
    }
    const fullSolvedIds = new Set(
      (userDoc.problemSolved || []).map((id) => id.toString())
    );
    const recommended = allProblems
      .filter((p) => !fullSolvedIds.has(p._id.toString()))
      .slice(0, 5);
    const recommendedFinal =
      recommended.length > 0
        ? recommended
        : allProblems.slice(-5).reverse();

    // Upcoming contests placeholder (static — no contests collection exists).
    // Returns the next 4 Sundays as placeholder weekly contest dates so the
    // UI has something to render. Real contest scheduling is a future feature.
    const upcomingContests = [];
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date(now);
      // Find the next Sunday at 10:00 UTC.
      const daysUntilSunday = (7 - d.getUTCDay()) % 7;
      d.setUTCDate(d.getUTCDate() + daysUntilSunday + i * 7);
      d.setUTCHours(10, 0, 0, 0);
      upcomingContests.push({
        id: `weekly-${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`,
        title: `Weekly Contest ${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
        startTime: d.toISOString(),
        durationMinutes: 90,
        type: "weekly",
      });
    }

    res.status(200).json({
      dailyChallenge: dailyChallenge
        ? {
            _id: dailyChallenge._id,
            title: dailyChallenge.title,
            difficulty: dailyChallenge.difficulty,
            tags: dailyChallenge.tags,
          }
        : null,
      recentSubmissions: profileData.recentSubmissions,
      recommendedProblems: recommendedFinal.map((p) => ({
        _id: p._id,
        title: p.title,
        difficulty: p.difficulty,
        tags: p.tags,
      })),
      stats: profileData.stats,
      activityGraph: profileData.activityGraph,
      upcomingContests,
    });
  } catch (err) {
    // Bug #28 fix: computeProfileStats throws with statusCode=404 when the
    // user is not found. Check it here so the dashboard returns 404, not 500.
    if (err.statusCode === 404) {
      return res.status(404).json({ error: "User not found" });
    }
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getProfile, getSubmissionHistory, getDashboard };
