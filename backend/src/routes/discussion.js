const express = require('express');

const discussionRouter = express.Router();
const userMiddleware = require('../middleware/userMiddleware');
const {
  getDiscussions, getDiscussion, createDiscussion,
  toggleDiscussionUpvote, addComment, toggleCommentUpvote,
  deleteDiscussion, deleteComment,
} = require('../controllers/discussion');

// All discussion endpoints require authentication.
discussionRouter.use(userMiddleware);

// Discussion list + detail
discussionRouter.get('/:problemId', getDiscussions);
discussionRouter.get('/:problemId/:discussionId', getDiscussion);
discussionRouter.post('/:problemId', createDiscussion);

// Upvote / delete discussion
discussionRouter.post('/:discussionId/upvote', toggleDiscussionUpvote);
discussionRouter.delete('/:discussionId', deleteDiscussion);

// Comments
discussionRouter.post('/:discussionId/comment', addComment);
discussionRouter.post('/:discussionId/comment/:commentId/upvote', toggleCommentUpvote);
discussionRouter.delete('/:discussionId/comment/:commentId', deleteComment);

module.exports = discussionRouter;
