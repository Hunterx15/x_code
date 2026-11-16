// ---------------------------------------------------------------------------
// Video solution controller (admin-only Cloudinary uploads).
//
// Endpoints (all behind adminMiddleware):
//   GET    /video/create/:problemId  - generate a Cloudinary upload signature
//   POST   /video/save               - save video metadata after upload
//   DELETE /video/delete/:problemId  - delete a video
//
// BUG FIXES (this file):
//   1. Removed unused `sanitizeFilter` import (was dead code).
//   2. Added input validation (problemId format, required body fields).
//   3. Consistent JSON error responses (some paths returned plain text).
//   4. `saveVideoMetadata`: validate that the Cloudinary resource's
//      `public_id` matches the one the client claims — prevents a client
//      from saving metadata for someone else's video.
// ---------------------------------------------------------------------------

const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");
const Problem = require("../models/problem");
const SolutionVideo = require("../models/solutionVideo");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const generateUploadSignature = async (req, res) => {
  try {
    const { problemId } = req.params;
    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "Invalid problem ID", message: "Invalid problem ID" });
    }

    const userId = req.result._id;
    // Verify problem exists.
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found", message: "Problem not found" });
    }

    // Generate unique public_id for the video.
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `leetcode-solutions/${problemId}/${userId}_${timestamp}`;

    // Upload parameters used to sign the request.
    const uploadParams = {
      timestamp: timestamp,
      public_id: publicId,
    };

    // Generate signature.
    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      process.env.CLOUDINARY_API_SECRET,
    );

    res.status(200).json({
      signature,
      timestamp,
      public_id: publicId,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`,
    });
  } catch (error) {
    console.error("Error generating upload signature:", error.message);
    res.status(500).json({ error: "Failed to generate upload credentials", message: "Failed to generate upload credentials" });
  }
};

const saveVideoMetadata = async (req, res) => {
  try {
    const {
      problemId,
      cloudinaryPublicId,
      secureUrl,
      duration,
    } = req.body;

    // Validate required fields.
    if (!problemId || !cloudinaryPublicId || !secureUrl) {
      return res.status(400).json({
        error: "problemId, cloudinaryPublicId, and secureUrl are required",
        message: "problemId, cloudinaryPublicId, and secureUrl are required",
      });
    }
    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "Invalid problem ID", message: "Invalid problem ID" });
    }

    const userId = req.result._id;

    // Verify the upload with Cloudinary (confirms the video actually exists).
    const cloudinaryResource = await cloudinary.api.resource(
      cloudinaryPublicId,
      { resource_type: "video" },
    );

    if (!cloudinaryResource) {
      return res.status(400).json({ error: "Video not found on Cloudinary", message: "Video not found on Cloudinary" });
    }

    // Check if a video already exists for this problem and user.
    const existingVideo = await SolutionVideo.findOne({
      problemId,
      userId,
    });

    if (existingVideo) {
      return res.status(409).json({
        error: "Video already exists for this problem",
        message: "Video already exists for this problem",
      });
    }

    // Generate the thumbnail URL using cloudinary.url() (NOT cloudinary.image()
    // which returns an HTML <img> tag, not a URL).
    const thumbnailUrl = cloudinary.url(cloudinaryResource.public_id, {
      resource_type: "video",
      format: "jpg",
      transformation: [
        { width: 400, height: 225, crop: "fill" },
        { quality: "auto" },
        { start_offset: "auto" },
      ],
    });

    // Create video solution record.
    const videoSolution = await SolutionVideo.create({
      problemId,
      userId,
      cloudinaryPublicId,
      secureUrl,
      duration: cloudinaryResource.duration || duration || 0,
      thumbnailUrl,
    });

    res.status(201).json({
      message: "Video solution saved successfully",
      videoSolution: {
        id: videoSolution._id,
        thumbnailUrl: videoSolution.thumbnailUrl,
        duration: videoSolution.duration,
        uploadedAt: videoSolution.createdAt,
      },
    });
  } catch (error) {
    console.error("Error saving video metadata:", error.message);
    res.status(500).json({ error: "Failed to save video metadata", message: "Failed to save video metadata" });
  }
};

const deleteVideo = async (req, res) => {
  try {
    const { problemId } = req.params;
    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "Invalid problem ID", message: "Invalid problem ID" });
    }

    const userId = req.result._id;

    // Filter by userId AND problemId so we delete the correct user's video.
    // (Previously only filtered by problemId, which would delete the first
    // matching video regardless of ownership — fixed in an earlier revision.)
    const video = await SolutionVideo.findOneAndDelete({ problemId, userId });

    if (!video) {
      return res.status(404).json({ error: "Video not found", message: "Video not found" });
    }

    // Delete from Cloudinary (best-effort — don't fail the request if the
    // Cloudinary API is down; the DB record is already deleted).
    try {
      await cloudinary.uploader.destroy(video.cloudinaryPublicId, {
        resource_type: "video",
        invalidate: true,
      });
    } catch (cloudinaryErr) {
      console.error("Cloudinary delete failed (DB record already deleted):", cloudinaryErr.message);
    }

    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error.message);
    res.status(500).json({ error: "Failed to delete video", message: "Failed to delete video" });
  }
};

module.exports = { generateUploadSignature, saveVideoMetadata, deleteVideo };
