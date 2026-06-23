// ---------------------------------------------------------------------------
// Batch J — Discussion controller.
//
// Endpoints (all behind userMiddleware, mounted at /discussion):
//   GET    /discussion/:problemId            -> list discussions for a problem (with pagination)
//   GET    /discussion/:problemId/:discussionId -> single discussion with comments
//   POST   /discussion/:problemId            -> create a new discussion
//   POST   /discussion/:discussionId/upvote  -> toggle upvote
//   POST   /discussion/:discussionId/comment -> add a comment
//   POST   /discussion/:discussionId/comment/:commentId/upvote -> toggle comment upvote
//   DELETE /discussion/:discussionId         -> delete own discussion
//   DELETE /discussion/:discussionId/comment/:commentId -> delete own comment
// ---------------------------------------------------------------------------

const mongoose = require("mongoose");
const Discussion = require("../models/discussion");

// ---------------------------------------------------------------------------
// GET /discussion/:problemId?page=&limit=&type=problem|editorial
// Returns paginated list of discussions (no comments — fetch separately).
// ---------------------------------------------------------------------------

const getDiscussions = async (req, res) => {
  try {
    const { problemId } = req.params;
    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "Invalid problem ID" });
    }
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const skip = (page - 1) * limit;
    const type = req.query.type === "editorial" ? "editorial" : "problem";

    const filter = { problemId, type };
    const [discussions, total] = await Promise.all([
      Discussion.find(filter)
        .sort({ pinned: -1, upvoteCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "firstName avatarUrl")
        .select("-comments"), // exclude comments from list view (perf)
      Discussion.countDocuments(filter),
    ]);

    // Map to include `hasUpvoted` for the current user
    const userId = req.result._id;
    const list = discussions.map((d) => {
      const obj = d.toObject();
      obj.hasUpvoted = d.upvotes.some((u) => u.toString() === userId.toString());
      delete obj.upvotes; // don't leak the full voter list
      return obj;
    });

    res.status(200).json({
      discussions: list,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("getDiscussions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// GET /discussion/:problemId/:discussionId — single discussion with comments
// ---------------------------------------------------------------------------

const getDiscussion = async (req, res) => {
  try {
    const { problemId, discussionId } = req.params;
    if (!mongoose.isValidObjectId(problemId) || !mongoose.isValidObjectId(discussionId)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const discussion = await Discussion.findOne({ _id: discussionId, problemId })
      .populate("userId", "firstName avatarUrl")
      .populate("comments.userId", "firstName avatarUrl");

    if (!discussion) {
      return res.status(404).json({ error: "Discussion not found" });
    }

    const userId = req.result._id;
    const obj = discussion.toObject();
    obj.hasUpvoted = discussion.upvotes.some((u) => u.toString() === userId.toString());
    // Mark each comment's hasUpvoted + upvoteCount, and strip the full upvotes
    // array so we don't leak the voter list to every client.
    // Bug #27 fix: the old code spread ...c (which includes c.upvotes) and
    // never deleted it, leaking every comment's voter ObjectIds.
    obj.comments = (obj.comments || []).map((c) => {
      const upvotes = c.upvotes || [];
      const { upvotes: _stripped, ...rest } = c;
      return {
        ...rest,
        hasUpvoted: upvotes.some((u) => u.toString() === userId.toString()),
        upvoteCount: upvotes.length,
      };
    });
    delete obj.upvotes;

    res.status(200).json({ discussion: obj });
  } catch (err) {
    console.error("getDiscussion error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// POST /discussion/:problemId — create a new discussion
// ---------------------------------------------------------------------------

const createDiscussion = async (req, res) => {
  try {
    const { problemId } = req.params;
    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "Invalid problem ID" });
    }
    const { title, content, type, tags } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const discussion = await Discussion.create({
      problemId,
      userId: req.result._id,
      title: title.trim(),
      content: content.trim(),
      type: type === "editorial" ? "editorial" : "problem",
      tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
    });

    await discussion.populate("userId", "firstName avatarUrl");
    res.status(201).json({ discussion });
  } catch (err) {
    console.error("createDiscussion error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// POST /discussion/:discussionId/upvote — toggle upvote
// ---------------------------------------------------------------------------

const toggleDiscussionUpvote = async (req, res) => {
  try {
    const { discussionId } = req.params;
    // Bug #34 fix: validate ObjectId before querying.
    if (!mongoose.isValidObjectId(discussionId)) {
      return res.status(400).json({ error: "Invalid discussion ID" });
    }
    const userId = req.result._id;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ error: "Discussion not found" });
    }

    const idx = discussion.upvotes.findIndex(
      (u) => u.toString() === userId.toString()
    );
    let upvoted;
    if (idx === -1) {
      discussion.upvotes.push(userId);
      upvoted = true;
    } else {
      discussion.upvotes.splice(idx, 1);
      upvoted = false;
    }
    await discussion.save();

    res.status(200).json({
      upvoted,
      upvoteCount: discussion.upvoteCount,
    });
  } catch (err) {
    console.error("toggleDiscussionUpvote error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// POST /discussion/:discussionId/comment — add a comment
// ---------------------------------------------------------------------------

const addComment = async (req, res) => {
  try {
    const { discussionId } = req.params;
    // Bug #34 fix: validate ObjectId before querying.
    if (!mongoose.isValidObjectId(discussionId)) {
      return res.status(400).json({ error: "Invalid discussion ID" });
    }
    const { content, parentCommentId } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ error: "Discussion not found" });
    }

    const comment = {
      userId: req.result._id,
      content: content.trim(),
      parentCommentId: parentCommentId || null,
    };
    discussion.comments.push(comment);
    await discussion.save();

    // Re-fetch with populate so we return the user info
    await discussion.populate("comments.userId", "firstName avatarUrl");
    const newComment = discussion.comments[discussion.comments.length - 1];

    res.status(201).json({
      comment: {
        ...newComment.toObject(),
        hasUpvoted: false,
        upvoteCount: 0,
      },
      commentCount: discussion.commentCount,
    });
  } catch (err) {
    console.error("addComment error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// POST /discussion/:discussionId/comment/:commentId/upvote — toggle comment upvote
// ---------------------------------------------------------------------------

const toggleCommentUpvote = async (req, res) => {
  try {
    const { discussionId, commentId } = req.params;
    // Bug #34 fix: validate both ObjectIds before querying.
    if (!mongoose.isValidObjectId(discussionId) || !mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    const userId = req.result._id;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ error: "Discussion not found" });
    }

    const comment = discussion.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const idx = comment.upvotes.findIndex(
      (u) => u.toString() === userId.toString()
    );
    let upvoted;
    if (idx === -1) {
      comment.upvotes.push(userId);
      upvoted = true;
    } else {
      comment.upvotes.splice(idx, 1);
      upvoted = false;
    }
    await discussion.save();

    res.status(200).json({
      upvoted,
      upvoteCount: comment.upvotes.length,
    });
  } catch (err) {
    console.error("toggleCommentUpvote error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// DELETE /discussion/:discussionId — delete own discussion (or admin)
// ---------------------------------------------------------------------------

const deleteDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    // Bug #34 fix: validate ObjectId before querying.
    if (!mongoose.isValidObjectId(discussionId)) {
      return res.status(400).json({ error: "Invalid discussion ID" });
    }
    const filter = { _id: discussionId };
    // Only the owner can delete (admins could too — add role check if needed)
    if (req.result.role !== "admin") {
      filter.userId = req.result._id;
    }
    const result = await Discussion.deleteOne(filter);
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Discussion not found or not authorized" });
    }
    res.status(200).json({ deleted: true });
  } catch (err) {
    console.error("deleteDiscussion error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// DELETE /discussion/:discussionId/comment/:commentId — delete own comment
// ---------------------------------------------------------------------------

const deleteComment = async (req, res) => {
  try {
    const { discussionId, commentId } = req.params;
    // Bug #34 fix: validate both ObjectIds before querying.
    if (!mongoose.isValidObjectId(discussionId) || !mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ error: "Discussion not found" });
    }
    const comment = discussion.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    if (comment.userId.toString() !== req.result._id.toString() && req.result.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }
    comment.deleteOne();
    await discussion.save();
    res.status(200).json({ deleted: true, commentCount: discussion.commentCount });
  } catch (err) {
    console.error("deleteComment error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getDiscussions,
  getDiscussion,
  createDiscussion,
  toggleDiscussionUpvote,
  addComment,
  toggleCommentUpvote,
  deleteDiscussion,
  deleteComment,
};
