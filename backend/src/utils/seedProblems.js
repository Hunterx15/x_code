const mongoose = require("mongoose");
const Problem = require("../models/problem");
const User = require("../models/user");
const redisClient = require("../config/redis");
const { LEETCODE_CATALOG } = require("../data/leetcodeCatalog");

/**
 * Idempotently seeds the 60-problem LeetCode catalog into MongoDB.
 * Skips any problem whose title already exists.
 */
async function seedCatalog({ creatorId = null } = {}) {
  let ownerId = creatorId;
  if (!ownerId) {
    let creator =
      (await User.findOne({ role: "admin" }).select("_id")) ||
      (await User.findOne({}).select("_id"));
    if (!creator) {
      creator = await User.create({
        firstName: "XCode",
        lastName: "Admin",
        emailId: "admin@xcode.dev",
        role: "admin",
        password: "seeded_admin_account_placeholder_hash",
        problemSolved: [],
      });
    }
    ownerId = creator._id;
  }

  const existingDocs = await Problem.find({}).select("title").lean();
  const existingTitles = new Set(
    existingDocs.map((d) => (d.title || "").trim().toLowerCase())
  );

  const toInsert = LEETCODE_CATALOG.filter(
    (p) => !existingTitles.has(p.title.trim().toLowerCase())
  ).map((p) => ({
    ...p,
    problemCreator: ownerId,
  }));

  if (toInsert.length > 0) {
    await Problem.insertMany(toInsert, { ordered: false });
    if (redisClient.isReady) {
      await redisClient.del("cache:all_problems").catch(() => {});
    }
  }

  return {
    inserted: toInsert.length,
    totalCatalog: LEETCODE_CATALOG.length,
    totalInDb: existingDocs.length + toInsert.length,
  };
}

// Standalone CLI execution (`npm run seed`)
if (require.main === module) {
  require("dotenv").config({
    path: require("path").resolve(__dirname, "../../.env"),
  });

  (async () => {
    const uri = process.env.DB_CONNECT_STRING;
    if (!uri) {
      console.error("DB_CONNECT_STRING is required in .env");
      process.exit(1);
    }
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");
    const stats = await seedCatalog();
    console.log(
      `Seeded ${stats.inserted} new problems (${stats.totalInDb} total in DB).`
    );
    await mongoose.disconnect();
  })().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
}

module.exports = { seedCatalog, LEETCODE_CATALOG };
