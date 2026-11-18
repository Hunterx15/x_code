// ---------------------------------------------------------------------------
// XCODE Zero-Dependency Load & Soak Benchmark Runner (Node 18+ built-in fetch).
//
// Usage:
//   node backend/loadtests/run-benchmark.js --mode=leaderboard --vus=100 --duration=20
//   node backend/loadtests/run-benchmark.js --mode=problems    --vus=100 --duration=20
//   node backend/loadtests/run-benchmark.js --mode=soak        --vus=25  --duration=300
//
// Optional flags:
//   --url=http://localhost:3000
//   --email=loadtest@xcode.dev
//   --pass=LoadTest123!
// ---------------------------------------------------------------------------

const { performance } = require("node:perf_hooks");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  })
);

const BASE_URL = (args.url || "http://localhost:3000").replace(/\/$/, "");
const MODE = args.mode || "leaderboard"; // leaderboard | problems | soak
const VUS = Math.max(1, Number(args.vus || (MODE === "soak" ? 25 : 100)));
const DURATION_SEC = Math.max(5, Number(args.duration || (MODE === "soak" ? 300 : 20)));
const EMAIL = args.email || "loadtest@xcode.dev";
const PASSWORD = args.pass || "LoadTest123!";

const extractToken = (res, body) => {
  if (body?.token) return body.token;
  const setCookie = res.headers.get("set-cookie") || "";
  const match = setCookie.match(/(?:^|,\s*)token=([^;]+)/);
  return match ? match[1] : null;
};

async function authenticate() {
  // Try login first
  let res = await fetch(`${BASE_URL}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailId: EMAIL, password: PASSWORD }),
  });
  let body = await res.json().catch(() => ({}));
  let token = extractToken(res, body);

  // If user doesn't exist yet, auto-register once
  if (!token && (res.status === 401 || res.status === 400)) {
    res = await fetch(`${BASE_URL}/user/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "LoadTest",
        lastName: "Runner",
        emailId: EMAIL,
        password: PASSWORD,
      }),
    });
    body = await res.json().catch(() => ({}));
    token = extractToken(res, body);
  }

  if (!token) {
    throw new Error(
      `Authentication failed (HTTP ${res.status}): ${JSON.stringify(body)}`
    );
  }
  return token;
}

const pickEndpoint = (mode) => {
  if (mode === "leaderboard") return "/user/leaderboard?page=1&limit=20";
  if (mode === "problems") return "/problem/getAllProblem";

  // Realistic soak-test traffic mix
  const r = Math.random();
  if (r < 0.5) return "/problem/getAllProblem";
  if (r < 0.8) return "/user/leaderboard?page=1&limit=20";
  if (r < 0.95) return "/user/dashboard";
  return "/contest/all";
};

const percentile = (sorted, p) => {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.ceil((p / 100) * sorted.length) - 1
  );
  return sorted[idx];
};

async function run() {
  console.log(`\n=== XCODE Load Benchmark ===`);
  console.log(`Target   : ${BASE_URL}`);
  console.log(`Mode     : ${MODE}`);
  console.log(`VUs      : ${VUS} concurrent workers`);
  console.log(`Duration : ${DURATION_SEC}s\n`);

  const token = await authenticate();
  const headers = {
    Authorization: `Bearer ${token}`,
    Cookie: `token=${token}`,
  };

  // Warmup (5 requests so JIT & connection pool settle)
  for (let i = 0; i < 5; i++) {
    await fetch(`${BASE_URL}${pickEndpoint(MODE)}`, { headers });
  }

  const latencies = [];
  const statusCounts = {};
  let networkErrors = 0;

  const startMs = performance.now();
  const endMs = startMs + DURATION_SEC * 1000;

  // Periodic progress reporter for longer runs (soak tests)
  const progressTimer = setInterval(() => {
    const elapsed = ((performance.now() - startMs) / 1000).toFixed(0);
    const rps = (latencies.length / Math.max(1, Number(elapsed))).toFixed(1);
    process.stdout.write(
      `\r[${elapsed}s / ${DURATION_SEC}s] completed=${latencies.length} rps=${rps} errors=${networkErrors}   `
    );
  }, 2000);

  const worker = async () => {
    while (performance.now() < endMs) {
      const path = pickEndpoint(MODE);
      const t0 = performance.now();
      try {
        const res = await fetch(`${BASE_URL}${path}`, { headers });
        await res.arrayBuffer(); // Ensure full body is consumed
        const dt = performance.now() - t0;
        latencies.push(dt);
        statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
      } catch {
        networkErrors++;
      }
    }
  };

  await Promise.all(Array.from({ length: VUS }, () => worker()));
  clearInterval(progressTimer);

  const totalSec = (performance.now() - startMs) / 1000;
  latencies.sort((a, b) => a - b);

  const totalReqs = latencies.length + networkErrors;
  const okReqs = Object.entries(statusCounts)
    .filter(([code]) => Number(code) >= 200 && Number(code) < 300)
    .reduce((sum, [, c]) => sum + c, 0);
  const failedReqs = totalReqs - okReqs;
  const errorRate = totalReqs > 0 ? (failedReqs / totalReqs) * 100 : 0;

  const avg =
    latencies.length > 0
      ? latencies.reduce((s, v) => s + v, 0) / latencies.length
      : 0;
  const rps = totalReqs / totalSec;

  console.log("\n\n=== RESULTS ===");
  console.log(`Total Requests : ${totalReqs}`);
  console.log(`Status Codes   : ${JSON.stringify(statusCounts)} (networkErrors=${networkErrors})`);
  console.log(`Error Rate     : ${errorRate.toFixed(2)}%`);
  console.log(`Throughput     : ${rps.toFixed(1)} req/s (${Math.round(rps * 60)} req/min)`);
  console.log(`Latency (ms)   :`);
  console.log(`  min : ${latencies[0]?.toFixed(1) || 0} ms`);
  console.log(`  avg : ${avg.toFixed(1)} ms`);
  console.log(`  p50 : ${percentile(latencies, 50).toFixed(1)} ms`);
  console.log(`  p95 : ${percentile(latencies, 95).toFixed(1)} ms`);
  console.log(`  p99 : ${percentile(latencies, 99).toFixed(1)} ms`);
  console.log(`  max : ${latencies[latencies.length - 1]?.toFixed(1) || 0} ms\n`);
}

run().catch((err) => {
  console.error("\nBenchmark failed:", err.message);
  process.exit(1);
});
