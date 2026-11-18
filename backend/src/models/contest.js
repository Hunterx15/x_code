const mongoose = require("mongoose");
const { Schema } = mongoose;

const contestSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default:
        "4 algorithmic challenges ranging from easy to hard. Rated for all participants.",
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    durationMinutes: {
      type: Number,
      default: 90,
    },
    type: {
      type: String,
      enum: ["weekly", "biweekly", "championship", "community"],
      default: "weekly",
    },
    badge: {
      type: String,
      default: "Rated",
    },
    problemCount: {
      type: Number,
      default: 4,
    },
    difficulty: {
      type: String,
      default: "1 Easy · 2 Medium · 1 Hard",
    },
    // Real playable problem set for this contest (with LeetCode point weights)
    problems: [
      {
        problemId: {
          type: Schema.Types.ObjectId,
          ref: "problem",
          required: true,
        },
        points: {
          type: Number,
          default: 4,
        },
      },
    ],
    // Atomic counter kept in sync with the ContestRegistration join collection.
    participantCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["upcoming", "live", "ended"],
      default: "upcoming",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true }
);

contestSchema.index({ status: 1, startTime: 1 });

const Contest = mongoose.model("contest", contestSchema);

module.exports = Contest;
