/**
 * XCode integration test — runs against the real Express app with
 * mocked MongoDB (Mongoose) and Redis.
 *
 * Run: cd x_code/backend && JWT_KEY=test-key node test-integration.js
 *
 * Tests: /health, unknown routes, register/login validation, all
 * protected routes return 401 JSON (not plain text — Bug #6 fix),
 * Google OAuth route exists.
 *
 * See the full Engineering Audit Report (Section 7.3) for the 30-test
 * breakdown.
 */

const Module = require("module");

// ── MOCKS ──────────────────────────────────────────────────────────

const mongooseStub = {
  connect: async () => {}, disconnect: async () => {}, connection: { readyState: 1 },
  isValidObjectId: (id) => /^[0-9a-fA-F]{24}$/.test(id), model: () => ({}),
  Schema: function () {}, Types: { ObjectId: "ObjectId" },
};
require.cache[require.resolve("mongoose")] = { id: "m", filename: "m", loaded: true, exports: mongooseStub };

const redisStub = { exists: async () => 0, set: async () => "OK", expireAt: async () => 1, connect: async () => {}, quit: async () => {}, isOpen: false, on: () => {} };
require.cache[require.resolve("./src/config/redis.js")] = { id: "r", filename: "r", loaded: true, exports: redisStub };
require.cache[require.resolve("./src/config/db.js")] = { id: "d", filename: "d", loaded: true, exports: async () => {} };

const chain = { select: () => chain, sort: () => chain, skip: () => chain, limit: () => chain, populate: () => chain, then: (r) => r([]) };
const mockModel = { find: () => chain, findById: async () => null, findOne: async () => null, create: async (d) => d, aggregate: async () => [], countDocuments: async () => 0, exists: async () => null };
["user","problem","submission","discussion","solutionVideo","userNote","userBadge","badge"].forEach((name) => {
  const p = require.resolve("./src/models/" + name + ".js");
  require.cache[p] = { id: p, filename: p, loaded: true, exports: mockModel };
});

require.cache[require.resolve("./src/utils/problemUtility.js")] = {
  id: "pu", filename: "pu", loaded: true,
  exports: { getLanguageById: (l) => ({ "c++": 54, java: 62, javascript: 63 })[l?.toLowerCase?.()], submitBatch: async () => [{ token: "t" }], submitToken: async () => [{ status_id: 3, time: "0.001", memory: 1024 }] },
};

// ── TESTS ──────────────────────────────────────────────────────────

process.env.JWT_KEY = process.env.JWT_KEY || "test-key";

// Suppress startup logs
const origLog = console.log;
console.log = (...args) => {
  const s = args[0]?.toString?.() || "";
  if (s.includes("MongoDB") || s.includes("Redis") || s.includes("Server listening")) return;
  origLog(...args);
};

const app = require("./src/index.js");
const http = require("http");

const request = (method, path, { body, headers = {} } = {}) => new Promise((resolve, reject) => {
  const data = body ? JSON.stringify(body) : null;
  const opts = { method, hostname: "127.0.0.1", port: 3000, path, headers: { ...headers, ...(data ? { "content-type": "application/json", "content-length": Buffer.byteLength(data) } : {}) } };
  const req = http.request(opts, (res) => {
    const chunks = [];
    res.on("data", (c) => chunks.push(c));
    res.on("end", () => { const raw = Buffer.concat(chunks).toString("utf-8"); let parsed; try { parsed = JSON.parse(raw); } catch { parsed = raw; } resolve({ status: res.statusCode, body: parsed }); });
  });
  req.on("error", reject); req.setTimeout(5000, () => req.destroy(new Error("timeout"))); if (data) req.write(data); req.end();
});

let pass = 0, fail = 0;
const expect = (name, cond) => { if (cond) { console.log(`  ✓ ${name}`); pass++; } else { console.log(`  ✗ ${name}`); fail++; } };

(async () => {
  await new Promise((r) => setTimeout(r, 1500));
  console.log("\n=== XCODE INTEGRATION TESTS ===\n");

  console.log("--- /health ---");
  const r = await request("GET", "/health");
  expect("returns 200", r.status === 200);
  expect("returns ok status", r.body?.status === "ok");

  console.log("\n--- Unknown route ---");
  const r2 = await request("GET", "/nonexistent");
  expect("returns 404", r2.status === 404);
  expect("returns JSON error (not plain text)", typeof r2.body === "object");

  console.log("\n--- /user/register (validation) ---");
  const r3 = await request("POST", "/user/register", { body: {} });
  expect("returns 400 on missing fields", r3.status === 400);
  expect("returns JSON error (Bug #6 fix)", typeof r3.body === "object");
  expect("has error field", typeof r3.body?.error === "string");

  console.log("\n--- /user/register (invalid email) ---");
  const r4 = await request("POST", "/user/register", { body: { firstName: "T", emailId: "bad", password: "Strong1!" } });
  expect("returns 400 on invalid email", r4.status === 400);

  console.log("\n--- /user/login (validation) ---");
  const r5 = await request("POST", "/user/login", { body: {} });
  expect("returns 400 on missing fields", r5.status === 400);
  expect("returns JSON error", typeof r5.body === "object");

  console.log("\n--- Protected routes return 401 JSON ---");
  for (const [m, p] of [
    ["GET", "/user/profile"], ["GET", "/user/check"], ["GET", "/user/dashboard"],
    ["GET", "/user/leaderboard"], ["GET", "/user/achievements"],
    ["GET", "/problem/getAllProblem"], ["POST", "/problem/create"],
    ["POST", "/submission/submit/507f1f77bcf86cd799439011"],
    ["POST", "/ai/chat"], ["GET", "/video/create/507f1f77bcf86cd799439011"],
    ["GET", "/discussion/507f1f77bcf86cd799439011"],
    ["GET", "/user/bookmarks"], ["GET", "/user/notes/507f1f77bcf86cd799439011"],
  ]) {
    const rr = await request(m, p, m === "POST" ? { body: {} } : {});
    expect(`${m} ${p} returns 401`, rr.status === 401);
    expect(`${m} ${p} returns JSON (not plain text)`, typeof rr.body === "object");
  }

  console.log("\n--- Google OAuth route exists ---");
  const r6 = await request("GET", "/user/auth/google");
  expect("does not return 404 (route exists)", r6.status !== 404);

  console.log(`\n=== SUMMARY: ${pass} passed, ${fail} failed ===`);
  process.exit(fail > 0 ? 1 : 0);
})().catch((err) => { console.error("Crash:", err); process.exit(1); });
