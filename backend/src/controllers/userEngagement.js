// ---------------------------------------------------------------------------
// Batch H — User engagement controller.
//
// Bookmark / Favorite / Recently Viewed / Notes — all reuse the User schema
// (bookmarkedProblems, favoriteProblems, recentlyViewed arrays) plus a
// separate UserNote collection for note content.
//
// All endpoints behind existing userMiddleware. No new auth, no new rate
// limiting (GET endpoints follow existing pattern).
// ---------------------------------------------------------------------------

const mongoose = require("mongoose");
const User = require("../models/user");
const UserNote = require("../models/userNote");
const Problem = require("../models/problem");

const MAX_RECENTLY_VIEWED = 20;

// ---------------------------------------------------------------------------
// Bookmark: toggle / list
// ---------------------------------------------------------------------------

const toggleBookmark = async (req, res) => {
  try {
    const { problemId } = req.params;
    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "Invalid problem ID" });
    }

    const user = req.result;
    const idx = user.bookmarkedProblems.findIndex(
      (id) => id.toString() === problemId
    );
    let bookmarked;
    if (idx === -1) {
      user.bookmarkedProblems.push(problemId);
      bookmarked = true;
    } else {
      user.bookmarkedProblems.splice(idx, 1);
      bookmarked = false;
    }
    await user.save();
    res.status(200).json({ bookmarked, bookmarkedCount: user.bookmarkedProblems.length });
  } catch (err) {
    console.error("toggleBookmark error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.result._id)
      .populate({
        path: "bookmarkedProblems",
        select: "_id title difficulty tags",
      });
    // Bug #32 fix: null-check user (could be deleted between middleware and here).
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ bookmarks: user.bookmarkedProblems || [] });
  } catch (err) {
    console.error("getBookmarks error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// Favorite: toggle / list
// ---------------------------------------------------------------------------

const toggleFavorite = async (req, res) => {
  try {
    const { problemId } = req.params;
    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "Invalid problem ID" });
    }

    const user = req.result;
    const idx = user.favoriteProblems.findIndex(
      (id) => id.toString() === problemId
    );
    let favorited;
    if (idx === -1) {
      user.favoriteProblems.push(problemId);
      favorited = true;
    } else {
      user.favoriteProblems.splice(idx, 1);
      favorited = false;
    }
    await user.save();
    res.status(200).json({ favorited, favoritedCount: user.favoriteProblems.length });
  } catch (err) {
    console.error("toggleFavorite error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.result._id)
      .populate({
        path: "favoriteProblems",
        select: "_id title difficulty tags",
      });
    // Bug #32 fix: null-check user.
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ favorites: user.favoriteProblems || [] });
  } catch (err) {
    console.error("getFavorites error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// Recently viewed: record a view (called from frontend on problem open)
// Capped at MAX_RECENTLY_VIEWED entries; most-recent-first on read.
// ---------------------------------------------------------------------------

const recordView = async (req, res) => {
  try {
    const { problemId } = req.params;
    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "Invalid problem ID" });
    }

    const user = req.result;
    // Remove any existing entry for this problem (so we can re-add at front)
    user.recentlyViewed = user.recentlyViewed.filter(
      (rv) => rv.problemId.toString() !== problemId
    );
    // Prepend the new entry
    user.recentlyViewed.unshift({ problemId, viewedAt: new Date() });
    // Cap the list
    if (user.recentlyViewed.length > MAX_RECENTLY_VIEWED) {
      user.recentlyViewed = user.recentlyViewed.slice(0, MAX_RECENTLY_VIEWED);
    }
    await user.save();
    res.status(200).json({ recorded: true });
  } catch (err) {
    console.error("recordView error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getRecentlyViewed = async (req, res) => {
  try {
    const user = await User.findById(req.result._id)
      .populate({
        path: "recentlyViewed.problemId",
        select: "_id title difficulty tags",
      });
    // Bug #32 fix: null-check user.
    if (!user) return res.status(404).json({ error: "User not found" });
    // Filter out entries where the problem was deleted (populate returns null)
    const list = (user.recentlyViewed || [])
      .filter((rv) => rv.problemId)
      .map((rv) => ({
        _id: rv.problemId._id,
        title: rv.problemId.title,
        difficulty: rv.problemId.difficulty,
        tags: rv.problemId.tags,
        viewedAt: rv.viewedAt,
      }));
    res.status(200).json({ recentlyViewed: list });
  } catch (err) {
    console.error("getRecentlyViewed error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// Notes: CRUD (per user, per problem)
// ---------------------------------------------------------------------------

const getNotes = async (req, res) => {
  try {
    const { problemId } = req.params;
    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "Invalid problem ID" });
    }
    const notes = await UserNote.find({
      userId: req.result._id,
      problemId,
    }).sort({ updatedAt: -1 });
    res.status(200).json({ notes });
  } catch (err) {
    console.error("getNotes error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const createNote = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { content } = req.body;
    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "Invalid problem ID" });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Note content is required" });
    }
    const note = await UserNote.create({
      userId: req.result._id,
      problemId,
      content: content.trim(),
    });
    res.status(201).json({ note });
  } catch (err) {
    console.error("createNote error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    // Bug #34 fix: validate ObjectId before querying.
    if (!mongoose.isValidObjectId(noteId)) {
      return res.status(400).json({ error: "Invalid note ID" });
    }
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Note content is required" });
    }
    const note = await UserNote.findOneAndUpdate(
      { _id: noteId, userId: req.result._id },
      { content: content.trim() },
      { new: true }
    );
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    res.status(200).json({ note });
  } catch (err) {
    console.error("updateNote error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    // Bug #34 fix: validate ObjectId before querying.
    if (!mongoose.isValidObjectId(noteId)) {
      return res.status(400).json({ error: "Invalid note ID" });
    }
    const result = await UserNote.deleteOne({
      _id: noteId,
      userId: req.result._id,
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Note not found" });
    }
    res.status(200).json({ deleted: true });
  } catch (err) {
    console.error("deleteNote error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  toggleBookmark,
  getBookmarks,
  toggleFavorite,
  getFavorites,
  recordView,
  getRecentlyViewed,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
};
