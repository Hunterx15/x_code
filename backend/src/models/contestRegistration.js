const mongoose = require("mongoose");
const { Schema } = mongoose;

// ---------------------------------------------------------------------------
// Separate ContestRegistration join collection.
//
// Storing participant IDs inside an array on the Contest document hits
// MongoDB's 16MB BSON document size limit and forces full document rewrites
// on every registration. A dedicated join collection with a unique compound
// index scales to millions of registrations with atomic, idempotent writes.
// ---------------------------------------------------------------------------

const contestRegistrationSchema = new Schema(
  {
    contestId: {
      type: Schema.Types.ObjectId,
      ref: "contest",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Guarantees a user can register at most once per contest, even under race conditions.
contestRegistrationSchema.index({ contestId: 1, userId: 1 }, { unique: true });
// Fast lookup of all contests a specific user is registered for.
contestRegistrationSchema.index({ userId: 1, registeredAt: -1 });

const ContestRegistration = mongoose.model(
  "contestRegistration",
  contestRegistrationSchema
);

module.exports = ContestRegistration;
