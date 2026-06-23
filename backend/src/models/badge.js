const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// ---------------------------------------------------------------------------
// Batch I: Badge definitions.
//
// Badges are STATIC — seeded in code (see controllers/achievements.js BADGE_DEFINITIONS).
// We do NOT store them in the DB because:
//   1. They rarely change
//   2. We avoid a migration step to seed them
//   3. The awarded-badge records (UserBadge) reference badge IDs as strings
//
// This model exists only if you want to make badges admin-editable later.
// For now it's unused — kept here so the collection name is reserved.
// ---------------------------------------------------------------------------

const badgeSchema = new Schema({
  badgeId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: 'award' }, // lucide icon name
  category: { type: String, enum: ['solved', 'streak', 'difficulty', 'speed', 'special'], default: 'solved' },
  tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
  threshold: { type: Number, default: 0 }, // e.g. 10 solved, 7-day streak, etc.
}, { timestamps: true });

module.exports = mongoose.model('Badge', badgeSchema);
