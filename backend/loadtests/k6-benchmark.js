// ---------------------------------------------------------------------------
// Grafana k6 Load & Soak Test Suite for XCODE Backend.
//
// Install k6 (macOS): brew install k6
//
// 1) Leaderboard / Cache test (run once with Redis OFF, once with Redis ON):
//    k6 run -e MODE=leaderboard -e VUS=200 -e DURATION=30s backend/loadtests/k6-benchmark.js
//
// 2) Mixed-traffic Soak test (10 minutes):
//    k6 run -e MODE=soak -e VUS=30 -e DURATION=10m backend/loadtests/k6-benchmark.js
// ---------------------------------------------------------------------------

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const MODE = __ENV.MODE || "leaderboard"; // leaderboard | problems | soak
const EMAIL = __ENV.EMAIL || "loadtest@xcode.dev";
const PASSWORD = __ENV.PASSWORD || "LoadTest123!";

export const options = {
  vus: Number(__ENV.VUS || (MODE === "soak" ? 30 : 100)),
  duration: __ENV.DURATION || (MODE === "soak" ? "10m" : "30s"),
  thresholds: {
    http_req_failed: ["rate<0.01"], // < 1% errors
    http_req_duration: ["p(95)<500"], // p95 < 500ms
  },
};

export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/user/login`,
    JSON.stringify({ emailId: EMAIL, password: PASSWORD }),
    { headers: { "Content-Type": "application/json" } }
  );

  const token = loginRes.cookies?.token?.[0]?.value || loginRes.json("token");
  if (!token) {
    throw new Error(
      `Login failed (${loginRes.status}). Seed user first with: node backend/loadtests/seed-loadtest-users.js`
    );
  }
  return { token };
}

export default function (data) {
  const params = {
    headers: {
      Authorization: `Bearer ${data.token}`,
      Cookie: `token=${data.token}`,
    },
  };

  let endpoint = "/user/leaderboard?page=1&limit=20";
  if (MODE === "problems") {
    endpoint = "/problem/getAllProblem";
  } else if (MODE === "soak") {
    const r = Math.random();
    if (r < 0.5) endpoint = "/problem/getAllProblem";
    else if (r < 0.8) endpoint = "/user/leaderboard?page=1&limit=20";
    else if (r < 0.95) endpoint = "/user/dashboard";
    else endpoint = "/contest/all";
  }

  const res = http.get(`${BASE_URL}${endpoint}`, params);
  check(res, { "status is 200": (r) => r.status === 200 });

  if (MODE === "soak") {
    sleep(0.2);
  }
}
