// ---------------------------------------------------------------------------
// Redis Sorted Set (ZSET) Leaderboard Service.
//
// Why ZSET instead of MongoDB full-collection aggregation?
//   - MongoDB `$project + $sort` over all users is O(N log N) per cache miss.
//   - Redis ZSET gives O(log N) score updates, O(log N + K) paginated reads,
//     and O(log N) exact rank lookups (`ZREVRANK`) for any user.
//
// Graceful Degradation:
//   - If Redis is offline or throws, every method returns `null` so callers
//     seamlessly fall back to MongoDB without breaking user requests.
// ---------------------------------------------------------------------------

const redisClient = require("../config/redis");
const User = require("../models/user");

const LEADERBOARD_KEY = "leaderboard:global:v1";
const HYDRATED_TTL_SEC = 3600; // Re-verify hydration at most once per hour

let hydrationInFlight = null;

// Hydrate the Redis ZSET from MongoDB on cold start (single-flight to avoid stampede).
const ensureHydrated = async () => {
  if (!redisClient.isOpen) return false;

  try {
    const exists = await redisClient.exists(LEADERBOARD_KEY);
    if (exists) return true;

    if (!hydrationInFlight) {
      hydrationInFlight = (async () => {
        const users = await User.aggregate([
          {
            $project: {
              _id: 1,
              totalSolved: {
                $cond: {
                  if: { $isArray: "$problemSolved" },
                  then: { $size: "$problemSolved" },
                  else: 0,
                },
              },
            },
          },
        ]);

        if (users.length === 0) return true;

        // Batch ZADD in chunks of 500 to avoid oversized Redis commands.
        const CHUNK_SIZE = 500;
        for (let i = 0; i < users.length; i += CHUNK_SIZE) {
          const members = users.slice(i, i + CHUNK_SIZE).map((u) => ({
            score: u.totalSolved,
            value: u._id.toString(),
          }));
          await redisClient.zAdd(LEADERBOARD_KEY, members);
        }
        await redisClient.expire(LEADERBOARD_KEY, HYDRATED_TTL_SEC);
        return true;
      })().finally(() => {
        hydrationInFlight = null;
      });
    }

    return await hydrationInFlight;
  } catch (err) {
    console.warn("Leaderboard ZSET hydration failed:", err.message);
    return false;
  }
};

// Update a single user's solved count in O(log N).
const setUserScore = async (userId, totalSolved) => {
  if (!redisClient.isOpen || !userId) return;
  try {
    const exists = await redisClient.exists(LEADERBOARD_KEY);
    if (!exists) return; // Will be hydrated lazily on next read
    await redisClient.zAdd(LEADERBOARD_KEY, {
      score: Number(totalSolved) || 0,
      value: userId.toString(),
    });
  } catch (err) {
    console.warn("Leaderboard ZSET setUserScore failed:", err.message);
  }
};

// Remove a deleted user from the ZSET in O(log N).
const removeUser = async (userId) => {
  if (!redisClient.isOpen || !userId) return;
  try {
    await redisClient.zRem(LEADERBOARD_KEY, userId.toString());
  } catch (err) {
    console.warn("Leaderboard ZSET removeUser failed:", err.message);
  }
};

// Fetch paginated slice in O(log N + limit). Returns null if Redis unavailable.
const getPaginatedIds = async (page, limit) => {
  const ready = await ensureHydrated();
  if (!ready) return null;

  try {
    const start = (page - 1) * limit;
    const stop = start + limit - 1;

    const [entries, total] = await Promise.all([
      redisClient.zRangeWithScores(LEADERBOARD_KEY, start, stop, { REV: true }),
      redisClient.zCard(LEADERBOARD_KEY),
    ]);

    return {
      entries: entries.map((e, i) => ({
        userId: e.value,
        totalSolved: Math.round(e.score),
        rank: start + i + 1,
      })),
      total,
    };
  } catch (err) {
    console.warn("Leaderboard ZSET getPaginatedIds failed:", err.message);
    return null;
  }
};

// Lookup a single user's global rank in O(log N). Returns null if Redis unavailable.
const getUserRank = async (userId) => {
  if (!userId) return null;
  const ready = await ensureHydrated();
  if (!ready) return null;

  try {
    const [zeroBasedRank, totalUsers] = await Promise.all([
      redisClient.zRevRank(LEADERBOARD_KEY, userId.toString()),
      redisClient.zCard(LEADERBOARD_KEY),
    ]);

    if (zeroBasedRank === null || zeroBasedRank === undefined) return null;
    const rank = zeroBasedRank + 1;
    const topPercent =
      totalUsers > 0 ? Math.max(1, Math.ceil((rank / totalUsers) * 100)) : 100;

    return { rank, totalUsers, topPercent };
  } catch (err) {
    console.warn("Leaderboard ZSET getUserRank failed:", err.message);
    return null;
  }
};

module.exports = {
  setUserScore,
  removeUser,
  getPaginatedIds,
  getUserRank,
};
