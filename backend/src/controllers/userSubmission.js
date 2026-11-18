// ---------------------------------------------------------------------------
// Code submission controller.
//
// Endpoints (all behind userMiddleware):
//   POST /submission/submit/:id         - enqueue graded submission -> 202 Accepted
//   GET  /submission/status/:submissionId - poll submission status & verdict
//   POST /submission/run/:id            - run code against visible test cases
// ---------------------------------------------------------------------------

const Problem = require("../models/problem");
const Submission = require("../models/submission");
const {
  getLanguageById,
  submitBatch,
  submitToken,
} = require("../utils/problemUtility");
const { enqueueSubmission } = require("../utils/submissionQueue");
const mongoose = require("mongoose");

const safeError = (err, defaultStatus = 500) => {
  const msg = err?.message || "Internal server error";
  return { error: msg, message: msg, status: defaultStatus };
};

const normalizeLanguage = (lang) => {
  if (!lang || typeof lang !== "string") return null;
  const lower = lang.toLowerCase().replace(/\s+/g, "").replace(/#.*$/, "");
  if (lower === "cpp" || lower === "c++" || lower === "cplusplus") return "c++";
  if (lower === "js" || lower === "javascript" || lower === "node" || lower === "nodejs") return "javascript";
  if (lower === "java") return "java";
  return null;
};

// ---------------------------------------------------------------------------
// POST /submission/submit/:id
// Non-blocking producer: persists pending Submission, enqueues background job,
// and immediately returns 202 Accepted with { submissionId, status: "pending" }.
// ---------------------------------------------------------------------------
const submitCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.id;

    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "Invalid problem ID", message: "Invalid problem ID" });
    }

    let { code, language } = req.body;

    if (!userId || !code || !problemId || !language) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "userId, code, problemId, and language are required",
      });
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

    const problem = await Problem.findById(problemId).select("hiddenTestCases");
    if (!problem) {
      return res.status(404).json({ error: "Problem not found", message: "Problem not found" });
    }

    const submittedResult = await Submission.create({
      userId,
      problemId,
      code,
      language,
      status: "pending",
      testCasesTotal: problem.hiddenTestCases.length,
    });

    const acceptedIntoQueue = enqueueSubmission({
      submissionId: submittedResult._id,
      userId,
      problemId,
      code,
      language,
      hiddenTestCases: problem.hiddenTestCases,
    });

    if (!acceptedIntoQueue) {
      await Submission.findByIdAndUpdate(submittedResult._id, {
        status: "error",
        errorMessage: "Submission queue is temporarily at capacity. Please retry shortly.",
      }).catch(() => {});
      return res.status(503).json({
        error: "Submission queue is busy, please try again in a few seconds.",
        message: "Submission queue is busy, please try again in a few seconds.",
      });
    }

    return res.status(202).json({
      submissionId: submittedResult._id,
      status: "pending",
      totalTestCases: submittedResult.testCasesTotal,
    });
  } catch (err) {
    console.error("submitCode error:", err);
    return res.status(500).json(safeError(err));
  }
};

// ---------------------------------------------------------------------------
// GET /submission/status/:submissionId
// Poll endpoint for async submissions. Enforces strict ownership check.
// ---------------------------------------------------------------------------
const getSubmissionStatus = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.result._id;

    if (!mongoose.isValidObjectId(submissionId)) {
      return res.status(400).json({ error: "Invalid submission ID", message: "Invalid submission ID" });
    }

    const sub = await Submission.findById(submissionId).select(
      "userId status errorMessage runtime memory testCasesPassed testCasesTotal runtimePercentile memoryPercentile newlyAwardedBadges"
    );

    if (!sub) {
      return res.status(404).json({ error: "Submission not found", message: "Submission not found" });
    }

    // Prevent IDOR: only the owner (or an admin) can inspect a submission's status.
    if (!sub.userId.equals(userId) && req.result.role !== "admin") {
      return res.status(403).json({ error: "Forbidden", message: "Forbidden" });
    }

    if (sub.status === "pending") {
      return res.status(200).json({
        submissionId: sub._id,
        status: "pending",
        totalTestCases: sub.testCasesTotal,
      });
    }

    const accepted = sub.status === "accepted";
    return res.status(200).json({
      submissionId: sub._id,
      status: sub.status,
      accepted,
      error: accepted ? null : sub.errorMessage || "Wrong Answer",
      totalTestCases: sub.testCasesTotal,
      passedTestCases: sub.testCasesPassed,
      runtime: sub.runtime,
      memory: sub.memory,
      runtimePercentile: sub.runtimePercentile ?? null,
      memoryPercentile: sub.memoryPercentile ?? null,
      newlyAwardedBadges: sub.newlyAwardedBadges || [],
    });
  } catch (err) {
    console.error("getSubmissionStatus error:", err);
    return res.status(500).json(safeError(err));
  }
};

// ---------------------------------------------------------------------------
// POST /submission/run/:id
// Runs user code against VISIBLE test cases (fast practice run).
// ---------------------------------------------------------------------------
const runCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.id;

    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "Invalid problem ID", message: "Invalid problem ID" });
    }

    let { code, language } = req.body;

    if (!userId || !code || !problemId || !language) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "userId, code, problemId, and language are required",
      });
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

    const problem = await Problem.findById(problemId).select("visibleTestCases");
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

    runtime = Number(runtime.toFixed(3));

    return res.status(200).json({
      success,
      testCases: testResult,
      runtime,
      memory,
      passedTestCases: testCasesPassed,
      totalTestCases: testResult.length,
    });
  } catch (err) {
    console.error("runCode error:", err);
    const status = err.message && err.message.includes("Judge0") ? 502 : 500;
    return res.status(status).json(safeError(err, status));
  }
};

module.exports = { submitCode, getSubmissionStatus, runCode };
