// ---------------------------------------------------------------------------
// Batch I — Achievements, Badges, Streak Milestones, Ranking, Leaderboard.
//
// Badge DEFINITIONS are static (in-code) so we avoid a seed migration.
// AWARDED badges are stored in the UserBadge collection (unique per user+badge).
//
// Endpoints (all behind userMiddleware, mounted at /user):
//   GET /user/achievements           -> current user's earned badges + progress toward next
//   GET /user/leaderboard?page=&limit= -> global ranking by total solved
//
// Internal helper:
//   checkAndAwardBadges(userId) -> called by submitCode after an accepted
//   submission to award any newly-earned badges.
// ---------------------------------------------------------------------------

const mongoose = require("mongoose");
const User = require("../models/user");
const Submission = require("../models/submission");
const UserBadge = require("../models/userBadge");

// ---------------------------------------------------------------------------
// Badge definitions — STATIC, in-code. Each has:
//   id, name, description, icon (lucide name), category, tier, threshold,
//   and an `evaluator(userStats)` function that returns true when earned.
// ---------------------------------------------------------------------------

const BADGE_DEFINITIONS = [
  // --- Solved count milestones ---
  {
    id: "first_solve",
    name: "First Blood",
    description: "Solve your first problem",
    icon: "Swords",
    category: "solved",
    tier: "bronze",
    threshold: 1,
    evaluator: (s) => s.totalSolved >= 1,
  },
  {
    id: "solved_10",
    name: "Getting Started",
    description: "Solve 10 problems",
    icon: "Sprout",
    category: "solved",
    tier: "bronze",
    threshold: 10,
    evaluator: (s) => s.totalSolved >= 10,
  },
  {
    id: "solved_50",
    name: "Half Century",
    description: "Solve 50 problems",
    icon: "Trophy",
    category: "solved",
    tier: "silver",
    threshold: 50,
    evaluator: (s) => s.totalSolved >= 50,
  },
  {
    id: "solved_100",
    name: "Centurion",
    description: "Solve 100 problems",
    icon: "Crown",
    category: "solved",
    tier: "gold",
    threshold: 100,
    evaluator: (s) => s.totalSolved >= 100,
  },
  {
    id: "solved_500",
    name: "Problem Master",
    description: "Solve 500 problems",
    icon: "Medal",
    category: "solved",
    tier: "platinum",
    threshold: 500,
    evaluator: (s) => s.totalSolved >= 500,
  },

  // --- Difficulty-specific milestones ---
  {
    id: "first_easy",
    name: "Easy Does It",
    description: "Solve your first Easy problem",
    icon: "Leaf",
    category: "difficulty",
    tier: "bronze",
    threshold: 1,
    evaluator: (s) => s.easy >= 1,
  },
  {
    id: "first_medium",
    name: "Stepping Up",
    description: "Solve your first Medium problem",
    icon: "Flame",
    category: "difficulty",
    tier: "bronze",
    threshold: 1,
    evaluator: (s) => s.medium >= 1,
  },
  {
    id: "first_hard",
    name: "Hard Hitter",
    description: "Solve your first Hard problem",
    icon: "Zap",
    category: "difficulty",
    tier: "silver",
    threshold: 1,
    evaluator: (s) => s.hard >= 1,
  },
  {
    id: "hard_25",
    name: "Hardened",
    description: "Solve 25 Hard problems",
    icon: "Skull",
    category: "difficulty",
    tier: "gold",
    threshold: 25,
    evaluator: (s) => s.hard >= 25,
  },

  // --- Streak milestones ---
  {
    id: "streak_3",
    name: "Warming Up",
    description: "Maintain a 3-day solving streak",
    icon: "Flame",
    category: "streak",
    tier: "bronze",
    threshold: 3,
    evaluator: (s) => s.streak >= 3,
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day solving streak",
    icon: "Flame",
    category: "streak",
    tier: "silver",
    threshold: 7,
    evaluator: (s) => s.streak >= 7,
  },
  {
    id: "streak_30",
    name: "Unstoppable",
    description: "Maintain a 30-day solving streak",
    icon: "Flame",
    category: "streak",
    tier: "gold",
    threshold: 30,
    evaluator: (s) => s.streak >= 30,
  },
  {
    id: "streak_100",
    name: "Eternal Flame",
    description: "Maintain a 100-day solving streak",
    icon: "Flame",
    category: "streak",
    tier: "platinum",
    threshold: 100,
    evaluator: (s) => s.streak >= 100,
  },

  // --- Submission volume / acceptance ---
  {
    id: "submissions_100",
    name: "Persistent",
    description: "Make 100 total submissions",
    icon: "Send",
    category: "solved",
    tier: "bronze",
    threshold: 100,
    evaluator: (s) => s.totalSubmissions >= 100,
  },
  {
    id: "acceptance_75",
    name: "Sharp Shooter",
    description: "Achieve 75%+ acceptance rate (min 20 submissions)",
    icon: "Target",
    category: "special",
    tier: "silver",
    threshold: 75,
    evaluator: (s) => s.totalSubmissions >= 20 && s.acceptanceRate >= 75,
  },
];

// ---------------------------------------------------------------------------
// Compute a user's stats for badge evaluation. Reuses the same calculation
// logic as userProfile.js's computeProfileStats (kept here separate to avoid
// a circular import — this controller is called from userSubmission.js).
// ---------------------------------------------------------------------------

const computeStatsForBadges = async (userId) => {
  const user = await User.findById(userId).populate({
    path: "problemSolved",
    select: "difficulty",
  });
  if (!user) return null;

  const breakdown = { easy: 0, medium: 0, hard: 0 };
  user.problemSolved.forEach((p) => {
    if (breakdown[p.difficulty] !== undefined) breakdown[p.difficulty]++;
  });

  const submissionStats = await Submission.aggregate([
    { $match: { userId: user._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        accepted: { $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] } },
      },
    },
  ]);
  const totalSubmissions = submissionStats[0]?.total || 0;
  const acceptedSubmissions = submissionStats[0]?.accepted || 0;
  const acceptanceRate =
    totalSubmissions > 0
      ? Math.round((acceptedSubmissions / totalSubmissions) * 1000) / 10
      : 0;

  // Streak (UTC-day based, matches userProfile.js)
  const acceptedDaysAgg = await Submission.aggregate([
    { $match: { userId: user._id, status: "accepted" } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } } },
  ]);
  const acceptedSet = new Set(acceptedDaysAgg.map((d) => d._id));
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  let cursor = new Date(today);
  if (!acceptedSet.has(todayStr)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  let streak = 0;
  for (let i = 0; i < 3650; i++) {
    const ds = cursor.toISOString().slice(0, 10);
    if (acceptedSet.has(ds)) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else break;
  }

  return {
    totalSolved: user.problemSolved.length,
    easy: breakdown.easy,
    medium: breakdown.medium,
    hard: breakdown.hard,
    totalSubmissions,
    acceptedSubmissions,
    acceptanceRate,
    streak,
  };
};

// ---------------------------------------------------------------------------
// Check all badges against the user's current stats and award any newly-earned
// ones. Returns the list of newly-awarded badge IDs (empty if none).
// Called by submitCode after an accepted submission.
// ---------------------------------------------------------------------------

const checkAndAwardBadges = async (userId) => {
  try {
    const stats = await computeStatsForBadges(userId);
    if (!stats) return [];

    // Fetch already-awarded badge IDs for this user
    const existing = await UserBadge.find({ userId }).distinct("badgeId");
    const existingSet = new Set(existing);

    const newlyAwarded = [];
    for (const badge of BADGE_DEFINITIONS) {
      if (existingSet.has(badge.id)) continue;
      if (badge.evaluator(stats)) {
        try {
          await UserBadge.create({ userId, badgeId: badge.id });
          newlyAwarded.push(badge);
        } catch (err) {
          // E11000 duplicate key — race condition with concurrent submissions.
          // Safe to ignore; the badge is already awarded.
          if (err.code !== 11000) throw err;
        }
      }
    }
    return newlyAwarded;
  } catch (err) {
    console.error("checkAndAwardBadges error:", err);
    return [];
  }
};

// ---------------------------------------------------------------------------
// GET /user/achievements
// Returns: { earned: [{...badge, awardedAt}], available: [{...badge, progress}] }
// ---------------------------------------------------------------------------

const getAchievements = async (req, res) => {
  try {
    const userId = req.result._id;
    const [stats, earnedRecords] = await Promise.all([
      computeStatsForBadges(userId),
      UserBadge.find({ userId }).sort({ awardedAt: -1 }),
    ]);

    // Bug #26 fix: computeStatsForBadges returns null if the user was deleted
    // between middleware and this call. Guard before accessing stats.totalSolved.
    if (!stats) {
      return res.status(404).json({ error: "User not found" });
    }

    const earnedMap = new Map(
      earnedRecords.map((r) => [r.badgeId, r.awardedAt])
    );

    const all = BADGE_DEFINITIONS.map((b) => {
      const awardedAt = earnedMap.get(b.id);
      // Compute progress toward this badge's threshold
      let current = 0;
      if (b.category === "solved" && b.id.startsWith("solved_")) current = stats.totalSolved;
      else if (b.category === "solved" && b.id === "first_solve") current = stats.totalSolved;
      else if (b.category === "solved" && b.id === "submissions_100") current = stats.totalSubmissions;
      else if (b.category === "difficulty" && b.id.startsWith("first_")) {
        current = b.id === "first_easy" ? stats.easy : b.id === "first_medium" ? stats.medium : stats.hard;
      } else if (b.category === "difficulty" && b.id === "hard_25") current = stats.hard;
      else if (b.category === "streak") current = stats.streak;
      else if (b.category === "special" && b.id === "acceptance_75") current = stats.acceptanceRate;

      return {
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        category: b.category,
        tier: b.tier,
        threshold: b.threshold,
        current,
        progress: b.threshold > 0 ? Math.min(100, Math.round((current / b.threshold) * 100)) : 0,
        earned: !!awardedAt,
        awardedAt: awardedAt || null,
      };
    });

    res.status(200).json({
      earned: all.filter((b) => b.earned),
      available: all.filter((b) => !b.earned),
      stats: {
        totalSolved: stats.totalSolved,
        easy: stats.easy,
        medium: stats.medium,
        hard: stats.hard,
        streak: stats.streak,
        acceptanceRate: stats.acceptanceRate,
        totalSubmissions: stats.totalSubmissions,
      },
    });
  } catch (err) {
    console.error("getAchievements error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// GET /user/leaderboard?page=1&limit=20
// Global ranking by totalSolved (problemSolved array length).
// Returns top N users with their rank, solved count, and earned badge count.
// ---------------------------------------------------------------------------

const getLeaderboard = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    // Aggregate: sort users by problemSolved length desc, project only what we need.
    const pipeline = [
      {
        $project: {
          firstName: 1,
          lastName: 1,
          avatarUrl: 1,
          totalSolved: { $size: "$problemSolved" },
        },
      },
      { $sort: { totalSolved: -1, _id: 1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const [users, total] = await Promise.all([
      User.aggregate(pipeline),
      User.countDocuments(),
    ]);

    // Batch-fetch badge counts for these users
    const userIds = users.map((u) => u._id);
    const badgeCounts = await UserBadge.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);
    const badgeMap = new Map(badgeCounts.map((b) => [b._id.toString(), b.count]));

    const ranked = users.map((u, i) => ({
      rank: skip + i + 1,
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      avatarUrl: u.avatarUrl || null,
      totalSolved: u.totalSolved,
      badgeCount: badgeMap.get(u._id.toString()) || 0,
    }));

    res.status(200).json({
      leaderboard: ranked,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("getLeaderboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  BADGE_DEFINITIONS,
  checkAndAwardBadges,
  getAchievements,
  getLeaderboard,
};
