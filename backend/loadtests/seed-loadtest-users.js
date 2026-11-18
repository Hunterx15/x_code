// ---------------------------------------------------------------------------
// Seed / Cleanup Synthetic Users for Local Leaderboard Load Testing.
//
// Usage (from backend/):
//   node loadtests/seed-loadtest-users.js           -> seeds 500 users + login account
//   node loadtests/seed-loadtest-users.js --cleanup -> removes all synthetic users
// ---------------------------------------------------------------------------

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../src/models/user");
const Problem = require("../src/models/problem");

const COUNT = Number(process.env.SEED_USERS || 500);
const BENCH_EMAIL = process.env.BENCH_EMAIL || "loadtest@xcode.dev";
const BENCH_PASS = process.env.BENCH_PASS || "LoadTest123!";
const DOMAIN_TAG = "@bench.local";

async function main() {
  const uri = process.env.DB_CONNECT_STRING;
  if (!uri) {
    console.error("Missing DB_CONNECT_STRING in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  if (process.argv.includes("--cleanup")) {
    const res = await User.deleteMany({
      emailId: { $regex: /@bench\.local$/ },
    });
    console.log(`Removed ${res.deletedCount} synthetic benchmark users.`);
    await mongoose.disconnect();
    return;
  }

  const problems = await Problem.find({}).select("_id").lean();
  const problemIds = problems.map((p) => p._id);

  // Ensure the login account exists
  const passwordHash = await bcrypt.hash(BENCH_PASS, 10);
  await User.findOneAndUpdate(
    { emailId: BENCH_EMAIL },
    {
      $setOnInsert: {
        firstName: "LoadTest",
        lastName: "Runner",
        emailId: BENCH_EMAIL,
        password: passwordHash,
        role: "user",
        problemSolved: problemIds.slice(0, Math.min(5, problemIds.length)),
      },
    },
    { upsert: true, new: true }
  );

  // Seed synthetic users with varied solved counts for realistic leaderboard sorting
  const existing = await User.countDocuments({
    emailId: { $regex: /@bench\.local$/ },
  });

  if (existing >= COUNT) {
    console.log(`Already have ${existing} synthetic benchmark users.`);
  } else {
    const toCreate = [];
    for (let i = existing; i < COUNT; i++) {
      const solvedCount =
        problemIds.length > 0
          ? Math.floor(Math.random() * (problemIds.length + 1))
          : 0;
      toCreate.push({
        firstName: `Bench${i}`,
        lastName: "Coder",
        emailId: `user_${i}${DOMAIN_TAG}`,
        password: passwordHash,
        role: "user",
        problemSolved: problemIds.slice(0, solvedCount),
      });
    }
    await User.insertMany(toCreate, { ordered: false });
    console.log(
      `Seeded ${toCreate.length} synthetic benchmark users (${COUNT} total).`
    );
  }

  console.log(`\nBenchmark login ready: ${BENCH_EMAIL} / ${BENCH_PASS}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
