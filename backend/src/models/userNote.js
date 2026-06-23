const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// ---------------------------------------------------------------------------
// UserNote — personal notes a user writes for a specific problem.
// Separate collection (not embedded in User) because notes can be long and
// a user may have many notes per problem over time.
//
// Index on {userId, problemId} for fast per-problem lookup.
// ---------------------------------------------------------------------------

const userNoteSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true,
  },
  problemId: {
    type: Schema.Types.ObjectId,
    ref: 'problem',
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
    default: '',
  },
  isPrivate: {
    type: Boolean,
    default: true, // user's personal notes are private by default
  },
}, { timestamps: true });

// Composite index for "get all notes by this user for this problem"
userNoteSchema.index({ userId: 1, problemId: 1 });

const UserNote = mongoose.model('userNote', userNoteSchema);

module.exports = UserNote;
