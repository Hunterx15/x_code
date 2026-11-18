// ---------------------------------------------------------------------------
// Bounded-Concurrency Async Submission Worker Queue.
//
// Decouples HTTP request handling from slow Judge0 code execution:
//   1. `POST /submission/submit/:id` creates a `pending` Submission record,
//      enqueues the job, and immediately responds `202 Accepted` (< 50ms).
//   2. Up to `MAX_CONCURRENCY` workers process Judge0 batches in the background,
//      preventing reverse-proxy 504 timeouts and Judge0 rate-limit storms.
//   3. Backpressure: if queue depth reaches `MAX_QUEUE_DEPTH`, enqueue() returns
//      false so the API returns `503 Service Unavailable` cleanly instead of OOM.
//   4. Clients poll `GET /submission/status/:submissionId` until status != pending.
// ---------------------------------------------------------------------------

const Submission = require("../models/submission");
const User = require("../models/user");
const {
  getLanguageById,
  submitBatch,
  submitToken,
} = require("./problemUtility");
const leaderboardService = require("./leaderboardService");

const MAX_CONCURRENCY = Number(process.env.SUBMISSION_CONCURRENCY) || 5;
const MAX_QUEUE_DEPTH = Number(process.env.SUBMISSION_QUEUE_MAX) || 100;

const queue = [];
let activeWorkers = 0;

const processJob = async (job) => {
  const { submissionId, userId, problemId, code, language, hiddenTestCases } =
    job;

  try {
    const languageId = getLanguageById(language);

    const submissions = hiddenTestCases.map((testcase) => ({
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
    let status = "accepted";
    let errorMessage = "";

    for (const test of testResult) {
      if (test.status_id == 3) {
        testCasesPassed++;
        runtime += parseFloat(test.time) || 0;
        memory = Math.max(memory, test.memory || 0);
      } else {
        // Judge0 CE status IDs: 4 = Wrong Answer, 5 = TLE, 6 = Compilation Error, 7-12 = Runtime Error
        if (test.status_id == 4) {
          status = "wrong";
          errorMessage = errorMessage || test.status?.description || "Wrong Answer";
        } else {
          status = "error";
          errorMessage =
            errorMessage ||
            test.compile_output ||
            test.stderr ||
            test.status?.description ||
            "Execution Error";
        }
      }
    }

    runtime = Number(runtime.toFixed(3));

    // Persist verdict first so percentile query includes this submission cleanly.
    await Submission.findByIdAndUpdate(submissionId, {
      status,
      testCasesPassed,
      errorMessage,
      runtime,
      memory,
    });

    let runtimePercentile = null;
    let memoryPercentile = null;
    let newlyAwardedBadges = [];

    if (status === "accepted") {
      // Atomic idempotent solve tracking + Redis ZSET leaderboard sync
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { problemSolved: problemId } },
        { new: true }
      ).select("problemSolved");

      if (updatedUser) {
        leaderboardService
          .setUserScore(userId, (updatedUser.problemSolved || []).length)
          .catch(() => {});
      }

      // Compute real runtime & memory percentiles using indexed counts
      try {
        const baseFilter = { problemId, language, status: "accepted" };
        const [totalAccepted, slowerCount, heavierCount] = await Promise.all([
          Submission.countDocuments(baseFilter),
          Submission.countDocuments({ ...baseFilter, runtime: { $gt: runtime } }),
          Submission.countDocuments({ ...baseFilter, memory: { $gt: memory } }),
        ]);
        if (totalAccepted > 1) {
          runtimePercentile = Math.min(
            100,
            Math.round((slowerCount / (totalAccepted - 1)) * 1000) / 10
          );
          memoryPercentile = Math.min(
            100,
            Math.round((heavierCount / (totalAccepted - 1)) * 1000) / 10
          );
        }
      } catch (pctErr) {
        console.warn("Worker percentile calculation failed:", pctErr.message);
      }

      // Evaluate newly earned badges
      try {
        const { checkAndAwardBadges } = require("../controllers/achievements");
        const badges = await checkAndAwardBadges(userId);
        newlyAwardedBadges = badges.map((b) => ({
          id: b.id,
          name: b.name,
          description: b.description,
          icon: b.icon,
          tier: b.tier,
        }));
      } catch (badgeErr) {
        console.warn("Worker badge check failed:", badgeErr.message);
      }

      await Submission.findByIdAndUpdate(submissionId, {
        runtimePercentile,
        memoryPercentile,
        newlyAwardedBadges,
      });
    }
  } catch (judgeErr) {
    console.error("Async submission worker error:", judgeErr?.message || judgeErr);
    await Submission.findByIdAndUpdate(submissionId, {
      status: "error",
      errorMessage: judgeErr?.message || "Code execution service unavailable",
    }).catch(() => {});
  }
};

const drain = () => {
  while (activeWorkers < MAX_CONCURRENCY && queue.length > 0) {
    const job = queue.shift();
    activeWorkers++;
    processJob(job).finally(() => {
      activeWorkers--;
      drain();
    });
  }
};

const enqueueSubmission = (job) => {
  if (queue.length >= MAX_QUEUE_DEPTH) {
    return false;
  }
  queue.push(job);
  setImmediate(drain);
  return true;
};

const getQueueStats = () => ({
  queued: queue.length,
  activeWorkers,
  maxConcurrency: MAX_CONCURRENCY,
  maxQueueDepth: MAX_QUEUE_DEPTH,
});

module.exports = {
  enqueueSubmission,
  getQueueStats,
};
