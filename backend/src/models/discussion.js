const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// ---------------------------------------------------------------------------
// Batch J: Discussion — a threaded discussion post attached to a problem.
//
// Design decisions:
//   - Comments are EMBEDDED (not a separate collection) because the typical
//     discussion has <100 comments and we want to fetch them in a single
//     query. If a discussion ever exceeds ~1000 comments we can migrate to
//     a separate collection — but that's a future concern.
//   - Upvotes are stored as an ARRAY of user ObjectIds (not just a count)
//     so we can detect "has this user upvoted?" in O(1) and prevent double-
//     voting. The `upvoteCount` field is denormalized for sorting.
//   - `type` distinguishes "problem" discussions (general Q&A about the
//     problem) from "editorial" discussions (comments about the official
//     solution/video).
// ---------------------------------------------------------------------------

const commentSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000,
  },
  upvotes: {
    type: [Schema.Types.ObjectId],
    default: [],
  },
  // Optional: which parent comment this is replying to (for 1 level of nesting)
  parentCommentId: {
    type: Schema.Types.ObjectId,
    default: null,
  },
}, { timestamps: true });

const discussionSchema = new Schema({
  problemId: {
    type: Schema.Types.ObjectId,
    ref: 'problem',
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 20000,
  },
  type: {
    type: String,
    enum: ['problem', 'editorial'],
    default: 'problem',
  },
  tags: {
    type: [String],
    default: [],
  },
  upvotes: {
    type: [Schema.Types.ObjectId],
    default: [],
  },
  upvoteCount: {
    type: Number,
    default: 0,
  },
  commentCount: {
    type: Number,
    default: 0,
  },
  comments: {
    type: [commentSchema],
    default: [],
  },
  // Soft-pin: admins can pin important discussions to the top
  pinned: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Index for sorting discussions by recency or by upvotes within a problem
discussionSchema.index({ problemId: 1, createdAt: -1 });
discussionSchema.index({ problemId: 1, upvoteCount: -1 });

// Keep upvoteCount + commentCount in sync with the arrays
discussionSchema.pre('save', function (next) {
  this.upvoteCount = this.upvotes.length;
  this.commentCount = this.comments.length;
  next();
});

const Discussion = mongoose.model('Discussion', discussionSchema);

module.exports = Discussion;
