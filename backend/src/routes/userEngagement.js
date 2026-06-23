const express = require('express');

const engagementRouter = express.Router();
const userMiddleware = require('../middleware/userMiddleware');
const {
  toggleBookmark, getBookmarks,
  toggleFavorite, getFavorites,
  recordView, getRecentlyViewed,
  getNotes, createNote, updateNote, deleteNote,
} = require('../controllers/userEngagement');

// All engagement endpoints require authentication.
engagementRouter.use(userMiddleware);

// Bookmark
engagementRouter.post('/bookmark/:problemId', toggleBookmark);
engagementRouter.get('/bookmarks', getBookmarks);

// Favorite
engagementRouter.post('/favorite/:problemId', toggleFavorite);
engagementRouter.get('/favorites', getFavorites);

// Recently viewed
engagementRouter.post('/recentlyViewed/:problemId', recordView);
engagementRouter.get('/recentlyViewed', getRecentlyViewed);

// Notes
engagementRouter.get('/notes/:problemId', getNotes);
engagementRouter.post('/notes/:problemId', createNote);
engagementRouter.put('/notes/:noteId', updateNote);
engagementRouter.delete('/notes/:noteId', deleteNote);

module.exports = engagementRouter;
