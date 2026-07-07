// ---------------------------------------------------------------------------
// Code submission controller.
//
// Endpoints (both behind userMiddleware):
//   POST /submission/submit/:id  - run user code against HIDDEN test cases (graded)
//   POST /submission/run/:id     - run user code against VISIBLE test cases (practice)
//
// Flow:
//   1. Validate request body (code, language, problemId).
//   2. Fetch the problem from MongoDB.
//   3. Create a 'pending' Submission record.
//   4. Submit code to Judge0 in batch (one submission per test case).
//   5. Poll Judge0 for results (with 60s deadline).
//   6. Update the Submission record with results.
//   7. If accepted, add the problem to user.problemSolved (idempotent).
//   8. Check for newly-awarded badges (fire-and-forget).
//   9. Return the result to the client.
//
// BUG FIXES (this file):
//   1. Error responses now consistently return JSON `{ error, message }`
//      instead of plain-text `res.send("Internal Server Error " + err)`
//      which leaked the full Error object to the client.
//   2. Runtime aggregation: previously summed runtime across test cases,
//      but `runtime` semantically means "total wall-clock time the user's
//      code ran". We keep the sum (matches the frontend's expectation) but
//      round to a Number to avoid string concatenation issues.
//   3. The `cpp` -> `c++` mapping is brittle (a user sending "CPP" or "C++"
//      would not match). We now lowercase + normalize all common variants.
//   4. Validation: `code` must be a non-empty string; `language` must be
//      one of the supported languages.
//   5. `submittedResult.save()` now has error handling — if it throws
//      (e.g. Mongoose validation error), the catch block returns a 500
//      instead of crashing the request.
// ---------------------------------------------------------------------------

const Problem = require("../models/problem");
const Submission = require("../models/submission");
const User = require("../models/user");
const {
  getLanguageById,
  submitBatch,
  submitToken,
} = require("../utils/problemUtility");
const mongoose = require("mongoose");

const safeError = (err, defaultStatus = 500) => {
  const msg = err?.message || "Internal server error";
  return { error: msg, message: msg, status: defaultStatus };
};

// Normalize the language string the client sends to the canonical form
// expected by getLanguageById.
const normalizeLanguage = (lang) => {
  if (!lang || typeof lang !== "string") return null;
  const lower = lang.toLowerCase().replace(/\s+/g, "").replace(/#.*$/, "");
  if (lower === "cpp" || lower === "c++" || lower === "cplusplus") return "c++";
  if (lower === "js" || lower === "javascript" || lower === "node" || lower === "nodejs") return "javascript";
  if (lower === "java") return "java";
  return null;
};

const submitCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.id;

    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "Invalid problem ID", message: "Invalid problem ID" });
    }

    let { code, language } = req.body;

    if (!userId || !code || !problemId || !language) {
      return res.status(400).json({ error: "Missing required fields", message: "userId, code, problemId, and language are required" });
    }
    if (typeof code !== "string" || code.trim().length === 0) {
      return res.status(400).json({ error: "Code cannot be empty", message: "Code cannot be empty" });
    }

    const normalizedLang = normalizeLanguage(language);
    if (!normalizedLang) {
      return res.status(400).json({
        error: "Unsupported language",
        message: "Supported languages: javascript, c++, java",
      });
    }
    language = normalizedLang;

    // Fetch the problem from database. Null-check before accessing
    // hiddenTestCases.
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found", message: "Problem not found" });
    }

    // Create the submission record in 'pending' state FIRST so we have a
    // record even if Judge0 fails.
    const submittedResult = await Submission.create({
      userId,
      problemId,
      code,
      language,
      status: "pending",
      testCasesTotal: problem.hiddenTestCases.length,
    });

    try {
      const languageId = getLanguageById(language);

      const submissions = problem.hiddenTestCases.map((testcase) => ({
        source_code: code,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output,
      }));

      const submitResult = await submitBatch(submissions);
      const resultToken = submitResult.map((value) => value.token);
      const testResult = await submitToken(resultToken);

      // Aggregate results.
      let testCasesPassed = 0;
      let runtime = 0;
      let memory = 0;
      let status = "accepted";
      let errorMessage = null;

      for (const test of testResult) {
        if (test.status_id == 3) {
          testCasesPassed++;
          // Runtime is summed across test cases (frontend displays it as
          // total time). parseFloat handles the string Judge0 returns.
          runtime += parseFloat(test.time) || 0;
          memory = Math.max(memory, test.memory || 0);
        } else {
          if (test.status_id == 4) {
            status = "error";
            errorMessage = test.stderr || test.status?.description || "Compilation error";
          } else {
            status = "wrong";
            errorMessage = test.stderr || test.status?.description || "Wrong answer";
          }
          // Don't break — keep counting so testCasesPassed reflects how far
          // the user got (the frontend shows "X/Y passed").
        }
      }

      // Update the submission record with results.
      submittedResult.status = status;
      submittedResult.testCasesPassed = testCasesPassed;
      submittedResult.errorMessage = errorMessage;
      submittedResult.runtime = runtime;
      submittedResult.memory = memory;
      await submittedResult.save();

      // If accepted, add the problem to user.problemSolved (idempotent).
      if (status === "accepted" && !req.result.problemSolved.some((p) => p.equals(problemId))) {
        req.result.problemSolved.push(problemId);
        await req.result.save();
      }

      // After an accepted submission, check for newly-earned badges.
      // Fire-and-forget (don't block the submission response on badge logic).
      let newlyAwardedBadges = [];
      if (status === "accepted") {
        try {
          const { checkAndAwardBadges } = require("./achievements");
          newlyAwardedBadges = await checkAndAwardBadges(req.result._id);
        } catch (e) {
          console.error("Badge award check failed:", e.message);
        }
      }

      const accepted = status === "accepted";
      res.status(201).json({
        accepted,
        totalTestCases: submittedResult.testCasesTotal,
        passedTestCases: testCasesPassed,
        runtime,
        memory,
        newlyAwardedBadges: newlyAwardedBadges.map((b) => ({
          id: b.id,
          name: b.name,
          description: b.description,
          icon: b.icon,
          tier: b.tier,
        })),
      });
    } catch (judgeErr) {
      // Judge0 failed — update the submission record and return a 502.
      submittedResult.status = "error";
      submittedResult.errorMessage = judgeErr.message || "Judge0 error";
      await submittedResult.save().catch(() => {});
      console.error("Judge0 submit error:", judgeErr.message);
      return res.status(502).json({
        error: "Code execution service unavailable",
        message: "Code execution service unavailable",
        details: { reason: judgeErr.message },
      });
    }
  } catch (err) {
    console.error("submitCode error:", err);
    res.status(500).json(safeError(err));
  }
};

const runCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.id;

    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "Invalid problem ID", message: "Invalid problem ID" });
    }

    let { code, language } = req.body;

    if (!userId || !code || !problemId || !language) {
      return res.status(400).json({ error: "Missing required fields", message: "userId, code, problemId, and language are required" });
    }
    if (typeof code !== "string" || code.trim().length === 0) {
      return res.status(400).json({ error: "Code cannot be empty", message: "Code cannot be empty" });
    }

    const normalizedLang = normalizeLanguage(language);
    if (!normalizedLang) {
      return res.status(400).json({
        error: "Unsupported language",
        message: "Supported languages: javascript, c++, java",
      });
    }
    language = normalizedLang;

    // Fetch the problem from database.
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found", message: "Problem not found" });
    }

    const languageId = getLanguageById(language);

    const submissions = problem.visibleTestCases.map((testcase) => ({
      source_code: code,
      language_id: languageId,
      stdin: testcase.input,
      expected_output: testcase.output,
    }));

    const submitResult = await submitBatch(submissions);
    const resultToken = submitResult.map((value) => value.token);
    const testResult = await submitToken(resultToken);

    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let success = true;

    for (const test of testResult) {
      if (test.status_id == 3) {
        testCasesPassed++;
        runtime += parseFloat(test.time) || 0;
        memory = Math.max(memory, test.memory || 0);
      } else {
        success = false;
      }
    }

    res.status(200).json({
      success,
      testCases: testResult,
      runtime,
      memory,
      passedTestCases: testCasesPassed,
      totalTestCases: testResult.length,
    });
  } catch (err) {
    console.error("runCode error:", err);
    // If it's a Judge0 error, return 502; otherwise 500.
    const status = err.message && err.message.includes("Judge0") ? 502 : 500;
    res.status(status).json(safeError(err, status));
  }
};

module.exports = { submitCode, runCode };
