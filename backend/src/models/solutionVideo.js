const mongoose = require("mongoose");
const { Schema } = mongoose;

const videoSchema = new Schema(
  {
    problemId: {
      type: Schema.Types.ObjectId,
      ref: "problem",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    videoType: {
      type: String,
      enum: ["cloudinary", "youtube"],
      default: "cloudinary",
    },
    cloudinaryPublicId: {
      type: String,
      sparse: true,
    },
    secureUrl: {
      type: String,
      required: true,
    },
    youtubeUrl: {
      type: String,
    },
    youtubeVideoId: {
      type: String,
    },
    thumbnailUrl: {
      type: String,
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const SolutionVideo = mongoose.model("solutionVideo", videoSchema);

module.exports = SolutionVideo;
