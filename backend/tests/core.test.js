const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const {
  cookieOptions,
  clearCookieOptions,
} = require("../src/config/cookieConfig");

const ROOT_DIR = path.resolve(__dirname, "../..");
const BACKEND_SRC = path.resolve(__dirname, "../src");
const FRONTEND_SRC = path.resolve(ROOT_DIR, "frontend/src");

const walkFiles = (dir, exts) => {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
};

const hasNodeModules = fs.existsSync(path.resolve(__dirname, "../node_modules"));

// ---------------------------------------------------------------------------
// 1. Cookie Security Policy Tests
// ---------------------------------------------------------------------------
test("cookieOptions uses SameSite=lax and secure=false in development", () => {
  const prevEnv = { ...process.env };
  try {
    process.env.NODE_ENV = "development";
    delete process.env.COOKIE_SAMESITE;
    delete process.env.COOKIE_SECURE;

    const opts = cookieOptions();
    assert.equal(opts.httpOnly, true);
    assert.equal(opts.sameSite, "lax");
    assert.equal(opts.secure, false);
    assert.equal(opts.maxAge, 60 * 60 * 1000);
  } finally {
    process.env = prevEnv;
  }
});

test("cookieOptions defaults to SameSite=none and secure=true in production", () => {
  const prevEnv = { ...process.env };
  try {
    process.env.NODE_ENV = "production";
    delete process.env.COOKIE_SAMESITE;
    delete process.env.COOKIE_SECURE;

    const opts = cookieOptions();
    assert.equal(opts.httpOnly, true);
    assert.equal(opts.sameSite, "none");
    assert.equal(opts.secure, true);
  } finally {
    process.env = prevEnv;
  }
});

test("cookieOptions forces secure=true whenever COOKIE_SAMESITE=none", () => {
  const prevEnv = { ...process.env };
  try {
    process.env.NODE_ENV = "development";
    process.env.COOKIE_SAMESITE = "none";
    process.env.COOKIE_SECURE = "false";

    const opts = cookieOptions();
    assert.equal(opts.sameSite, "none");
    assert.equal(opts.secure, true);
  } finally {
    process.env = prevEnv;
  }
});

test("clearCookieOptions strips maxAge for Express 5 clearCookie compatibility", () => {
  const opts = clearCookieOptions();
  assert.equal(opts.httpOnly, true);
  assert.equal("maxAge" in opts, false);
});

// ---------------------------------------------------------------------------
// 2. Repository Integrity Guards (Prevent Broken Deploys)
// ---------------------------------------------------------------------------
test("no leftover git merge conflict markers exist in backend/src or frontend/src", () => {
  const files = [
    ...walkFiles(BACKEND_SRC, [".js"]),
    ...walkFiles(FRONTEND_SRC, [".js", ".jsx", ".css"]),
  ];
  assert.ok(files.length > 0, "Expected source files to scan");

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const hasConflict = /^(<{7}|>{7}) /m.test(content);
    assert.equal(
      hasConflict,
      false,
      `Found git conflict marker in ${path.relative(ROOT_DIR, file)}`
    );
  }
});

test("every backend JS file passes Node syntax check", () => {
  const files = walkFiles(BACKEND_SRC, [".js"]);
  assert.ok(files.length > 0);
  for (const file of files) {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  }
});

test("no frontend module has duplicate default exports", () => {
  const files = walkFiles(FRONTEND_SRC, [".js", ".jsx"]);
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const matches = content.match(/\bexport\s+default\b/g) || [];
    assert.ok(
      matches.length <= 1,
      `Found ${matches.length} default exports in ${path.relative(ROOT_DIR, file)}`
    );
  }
});

// ---------------------------------------------------------------------------
// 3. Domain Logic Tests (when backend/node_modules is installed)
// ---------------------------------------------------------------------------
test(
  "validator enforces mandatory fields, valid email, and strong password",
  { skip: !hasNodeModules },
  () => {
    const validate = require("../src/utils/validator");

    assert.throws(() => validate({ emailId: "a@b.com" }), /Missing/i);
    assert.throws(
      () =>
        validate({
          firstName: "Ada",
          emailId: "not-an-email",
          password: "StrongPassword1!",
        }),
      /Invalid Email/i
    );
    assert.throws(
      () =>
        validate({
          firstName: "Ada",
          emailId: "ada@example.com",
          password: "weak",
        }),
      /Weak Password/i
    );
    assert.doesNotThrow(() =>
      validate({
        firstName: "Ada",
        emailId: "ada@example.com",
        password: "StrongPassword1!",
      })
    );
  }
);

test(
  "problemUtility maps supported languages to Judge0 CE language IDs",
  { skip: !hasNodeModules },
  () => {
    const { getLanguageById } = require("../src/utils/problemUtility");
    assert.equal(getLanguageById("c++"), 54);
    assert.equal(getLanguageById("java"), 62);
    assert.equal(getLanguageById("javascript"), 63);
    assert.equal(getLanguageById("JavaScript"), 63);
    assert.equal(getLanguageById("ruby"), undefined);
  }
);

test(
  "BADGE_DEFINITIONS evaluators accurately score milestones",
  { skip: !hasNodeModules },
  () => {
    const { BADGE_DEFINITIONS } = require("../src/controllers/achievements");
    assert.ok(Array.isArray(BADGE_DEFINITIONS) && BADGE_DEFINITIONS.length > 0);

    const firstBlood = BADGE_DEFINITIONS.find((b) => b.id === "first_solve");
    assert.ok(firstBlood);
    assert.equal(firstBlood.evaluator({ totalSolved: 0 }), false);
    assert.equal(firstBlood.evaluator({ totalSolved: 1 }), true);
  }
);

test(
  "extractYouTubeId correctly parses standard, short, embed, and query YouTube URLs",
  { skip: !hasNodeModules },
  () => {
    const { extractYouTubeId } = require("../src/controllers/videoSection");
    assert.equal(
      extractYouTubeId("https://www.youtube.com/watch?v=KLlXCFG5TnA"),
      "KLlXCFG5TnA"
    );
    assert.equal(
      extractYouTubeId("https://youtu.be/KLlXCFG5TnA"),
      "KLlXCFG5TnA"
    );
    assert.equal(
      extractYouTubeId("https://www.youtube.com/embed/KLlXCFG5TnA"),
      "KLlXCFG5TnA"
    );
    assert.equal(
      extractYouTubeId("https://youtube.com/shorts/KLlXCFG5TnA"),
      "KLlXCFG5TnA"
    );
    assert.equal(
      extractYouTubeId(
        "https://www.youtube.com/watch?v=KLlXCFG5TnA&feature=shared"
      ),
      "KLlXCFG5TnA"
    );
    assert.equal(extractYouTubeId("KLlXCFG5TnA"), "KLlXCFG5TnA");
    assert.equal(extractYouTubeId("not-a-valid-url"), null);
    assert.equal(extractYouTubeId(""), null);
  }
);
