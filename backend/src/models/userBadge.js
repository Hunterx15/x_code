const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// ---------------------------------------------------------------------------
// Batch I: UserBadge — awarded badge records.
//
// Composite unique index on {userId, badgeId} so a user can't earn the same
// badge twice.
// ---------------------------------------------------------------------------

const userBadgeSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true,
  },
  badgeId: {
    type: String,
    required: true, // references BADGE_DEFINITIONS in controllers/achievements.js
  },
  awardedAt: {
    type: Date,
    default: Date.now,
  },
  // Optional context (e.g. which problem triggered the badge)
  context: {
    type: Schema.Types.Mixed,
    default: null,
  },
}, { timestamps: true });

userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

module.exports = mongoose.model('UserBadge', userBadgeSchema);
