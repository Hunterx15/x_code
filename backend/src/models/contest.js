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
      default: "4 algorithmic challenges ranging from easy to hard. Rated for all participants.",
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
      enum: ["weekly", "biweekly", "championship"],
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
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],
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

// Virtual for registration count
contestSchema.virtual("registeredCount").get(function () {
  return this.participants ? this.participants.length : 0;
});

const Contest = mongoose.model("contest", contestSchema);

module.exports = Contest;
