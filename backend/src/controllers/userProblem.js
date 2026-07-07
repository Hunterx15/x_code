// ---------------------------------------------------------------------------
// Problem CRUD controller.
//
// Endpoints (all behind adminMiddleware for write ops, userMiddleware for reads):
//   POST   /problem/create             - create a problem (admin only)
//   PUT    /problem/update/:id         - update a problem (admin only)
//   DELETE /problem/delete/:id         - delete a problem (admin only)
//   GET    /problem/problemById/:id    - fetch a single problem + engagement metadata
//   GET    /problem/getAllProblem      - fetch all problems (list view)
//   GET    /problem/problemSolvedByUser- list problems the user has solved
//   GET    /problem/submittedProblem/:pid - list the user's submissions for a problem
//
// BUG FIXES (this file):
//   1. `req.result?. _id` (typo with space) — fixed to `req.result?._id`.
//   2. Error responses now consistently return JSON `{ error, message }`
//      instead of plain-text `res.send("Error: " + err)`.
//   3. `updateProblem` now validates that `id` and required body fields exist
//      before destructuring (prevents "Cannot destructure property 'language'
//      of 'undefined'" crashes).
//   4. Fixed numerous typos: "persent" -> "present", "Loggin" -> "Logged in".
//   5. `submittedProblem` returns 200 with `[]` instead of a string "No
//      Submission is persent" — the frontend expects an array.
//   6. `getAllProblem` returns 200 with `[]` instead of a string when no
//      problems exist (404 was wrong — the resource exists, it's just empty).
// ---------------------------------------------------------------------------

const {
  getLanguageById,
  submitBatch,
  submitToken,
} = require("../utils/problemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");
const SolutionVideo = require("../models/solutionVideo");
const mongoose = require("mongoose");

const safeError = (err, defaultStatus = 500) => {
  const msg = err?.message || "Internal server error";
  return { error: msg, message: msg, status: defaultStatus };
};

const createProblem = async (req, res) => {
  const {
    title,
    description,
    difficulty,
    tags,
    visibleTestCases,
    hiddenTestCases,
    startCode,
    referenceSolution,
  } = req.body;

  try {
    // Validate required fields before doing any work.
    if (!title || !description || !difficulty || !tags) {
      return res.status(400).json({ error: "Missing required fields", message: "Missing required fields (title, description, difficulty, tags)" });
    }
    if (!Array.isArray(visibleTestCases) || visibleTestCases.length === 0) {
      return res.status(400).json({ error: "visibleTestCases is required", message: "visibleTestCases is required and must be a non-empty array" });
    }
    if (!Array.isArray(hiddenTestCases) || hiddenTestCases.length === 0) {
      return res.status(400).json({ error: "hiddenTestCases is required", message: "hiddenTestCases is required and must be a non-empty array" });
    }
    if (!Array.isArray(referenceSolution) || referenceSolution.length === 0) {
      return res.status(400).json({ error: "referenceSolution is required", message: "referenceSolution is required and must be a non-empty array" });
    }

    // Validate each reference solution against the visible test cases via Judge0.
    for (const { language, completeCode } of referenceSolution) {
      const languageId = getLanguageById(language);
      const submissions = visibleTestCases.map((testcase) => ({
        source_code: completeCode,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output,
      }));

      const submitResult = await submitBatch(submissions);
      const resultToken = submitResult.map((value) => value.token);
      const testResult = await submitToken(resultToken);

      for (const test of testResult) {
        if (test.status_id != 3) {
          return res.status(400).json({
            error: "Reference solution failed visible test cases",
            message: "Reference solution failed visible test cases",
            details: { language, status: test.status, stderr: test.stderr },
          });
        }
      }
    }

    // Whitelist fields — no mass assignment via ...req.body.
    const userProblem = await Problem.create({
      title,
      description,
      difficulty,
      tags,
      visibleTestCases,
      hiddenTestCases,
      startCode,
      referenceSolution,
      problemCreator: req.result._id,
    });

    res.status(201).json({
      message: "Problem saved successfully",
      problem: { _id: userProblem._id, title: userProblem.title },
    });
  } catch (err) {
    res.status(400).json(safeError(err, 400));
  }
};

const updateProblem = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    difficulty,
    tags,
    visibleTestCases,
    hiddenTestCases,
    startCode,
    referenceSolution,
  } = req.body;

  try {
    if (!id) {
      return res.status(400).json({ error: "Missing problem ID", message: "Missing problem ID" });
    }
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid problem ID", message: "Invalid problem ID" });
    }

    const dsaProblem = await Problem.findById(id);
    if (!dsaProblem) {
      return res.status(404).json({ error: "Problem not found", message: "Problem not found" });
    }

    // Only validate the reference solution if it's provided.
    if (Array.isArray(referenceSolution) && referenceSolution.length > 0) {
      const testCasesToUse =
        Array.isArray(visibleTestCases) && visibleTestCases.length > 0
          ? visibleTestCases
          : dsaProblem.visibleTestCases;

      for (const { language, completeCode } of referenceSolution) {
        const languageId = getLanguageById(language);
        const submissions = testCasesToUse.map((testcase) => ({
          source_code: completeCode,
          language_id: languageId,
          stdin: testcase.input,
          expected_output: testcase.output,
        }));

        const submitResult = await submitBatch(submissions);
        const resultToken = submitResult.map((value) => value.token);
        const testResult = await submitToken(resultToken);

        for (const test of testResult) {
          if (test.status_id != 3) {
            return res.status(400).json({
              error: "Reference solution failed visible test cases",
              message: "Reference solution failed visible test cases",
              details: { language, status: test.status, stderr: test.stderr },
            });
          }
        }
      }
    }

    // Build the update object from whitelisted fields. Only update fields
    // that were actually provided in the request body.
    const update = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (difficulty !== undefined) update.difficulty = difficulty;
    if (tags !== undefined) update.tags = tags;
    if (visibleTestCases !== undefined) update.visibleTestCases = visibleTestCases;
    if (hiddenTestCases !== undefined) update.hiddenTestCases = hiddenTestCases;
    if (startCode !== undefined) update.startCode = startCode;
    if (referenceSolution !== undefined) update.referenceSolution = referenceSolution;

    const newProblem = await Problem.findByIdAndUpdate(id, update, {
      runValidators: true,
      new: true,
    });

    res.status(200).json({ problem: newProblem });
  } catch (err) {
    res.status(500).json(safeError(err));
  }
};

const deleteProblem = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(400).json({ error: "Missing problem ID", message: "Missing problem ID" });
    }
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid problem ID", message: "Invalid problem ID" });
    }

    const deletedProblem = await Problem.findByIdAndDelete(id);
    if (!deletedProblem) {
      return res.status(404).json({ error: "Problem not found", message: "Problem not found" });
    }

    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json(safeError(err));
  }
};

const getProblemById = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(400).json({ error: "Missing problem ID", message: "Missing problem ID" });
    }
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid problem ID", message: "Invalid problem ID" });
    }

    const getProblem = await Problem.findById(id).select(
      "_id title description difficulty tags visibleTestCases startCode referenceSolution",
    );
    if (!getProblem) {
      return res.status(404).json({ error: "Problem not found", message: "Problem not found" });
    }

    // Record this view in the user's recentlyViewed list (best-effort,
    // don't block the response on it). Capped at 20 entries.
    // BUG FIX: `req.result?. _id` (typo with space) — fixed to `req.result?._id`.
    if (req.result?._id) {
      try {
        const user = req.result;
        user.recentlyViewed = (user.recentlyViewed || []).filter(
          (rv) => rv.problemId.toString() !== id,
        );
        user.recentlyViewed.unshift({ problemId: id, viewedAt: new Date() });
        if (user.recentlyViewed.length > 20) {
          user.recentlyViewed = user.recentlyViewed.slice(0, 20);
        }
        await user.save();
        req.result = user;
      } catch (e) {
        console.error("recordView error:", e.message);
      }
    }

    // Fetch up to 5 related problems (same tag, excluding current).
    const relatedProblems = await Problem.find({
      tags: getProblem.tags,
      _id: { $ne: id },
    })
      .select("_id title difficulty tags")
      .limit(5);

    // Include the user's bookmark + favorite status for this problem
    // so the frontend can render the toggle buttons in the correct state.
    const isBookmarked = (req.result?.bookmarkedProblems || []).some(
      (pid) => pid.toString() === id,
    );
    const isFavorite = (req.result?.favoriteProblems || []).some(
      (pid) => pid.toString() === id,
    );

    const videos = await SolutionVideo.findOne({ problemId: id });

    // Gate referenceSolution behind accepted-submission OR admin role.
    // Admins always see it. Normal users only see it AFTER they have an
    // accepted submission for this problem.
    const problemObj = getProblem.toObject();
    const isAdmin = req.result?.role === "admin";
    if (!isAdmin) {
      const acceptedSubmission = await Submission.exists({
        userId: req.result._id,
        problemId: id,
        status: "accepted",
      });
      if (!acceptedSubmission) {
        delete problemObj.referenceSolution;
      }
    }

    // Attach engagement metadata (additive — frontend reads via optional chaining)
    problemObj.isBookmarked = isBookmarked;
    problemObj.isFavorite = isFavorite;
    problemObj.relatedProblems = relatedProblems;

    if (videos) {
      const responseData = {
        ...problemObj,
        secureUrl: videos.secureUrl,
        thumbnailUrl: videos.thumbnailUrl,
        duration: videos.duration,
      };
      return res.status(200).json(responseData);
    }

    res.status(200).json(problemObj);
  } catch (err) {
    res.status(500).json(safeError(err));
  }
};

const getAllProblem = async (req, res) => {
  try {
    const getProblem = await Problem.find({}).select(
      "_id title difficulty tags",
    );

    // BUG FIX: return 200 with [] instead of 404 with a string when there
    // are no problems. The collection exists; it's just empty. Returning a
    // string "Problem is Missing" broke the frontend, which expected an array.
    if (getProblem.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(getProblem);
  } catch (err) {
    res.status(500).json(safeError(err));
  }
};

const solvedAllProblembyUser = async (req, res) => {
  try {
    const userId = req.result._id;

    const user = await User.findById(userId).populate({
      path: "problemSolved",
      select: "_id title difficulty tags",
    });

    // BUG FIX: null-check the user (could be deleted between middleware and here).
    if (!user) {
      return res.status(404).json({ error: "User not found", message: "User not found" });
    }

    res.status(200).json(user.problemSolved || []);
  } catch (err) {
    res.status(500).json(safeError(err));
  }
};

const submittedProblem = async (req, res) => {
  try {
    const userId = req.result._id;
    const { pid: problemId } = req.params;

    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "Invalid problem ID", message: "Invalid problem ID" });
    }

    const ans = await Submission.find({ userId, problemId });

    // BUG FIX: return 200 with [] instead of a string when no submissions
    // exist. The frontend expects an array.
    if (ans.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(ans);
  } catch (err) {
    res.status(500).json(safeError(err));
  }
};

module.exports = {
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemById,
  getAllProblem,
  solvedAllProblembyUser,
  submittedProblem,
};
