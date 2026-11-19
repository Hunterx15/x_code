// ---------------------------------------------------------------------------
// Video solution controller (Cloudinary uploads & YouTube video attachments).
//
// Endpoints (behind adminMiddleware):
//   GET    /video/create/:problemId     - generate a Cloudinary upload signature
//   POST   /video/save                  - save Cloudinary video metadata after upload
//   POST   /video/save-youtube          - attach/update YouTube video URL for a problem
//   GET    /video/problem/:problemId    - get video metadata for a specific problem
//   GET    /video/all                   - get list of all problems with attached videos
//   DELETE /video/delete/:problemId     - delete a video (Cloudinary or YouTube)
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

/**
 * Extracts the 11-character YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 * - Raw 11-character ID
 */
const extractYouTubeId = (url) => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
};

const generateUploadSignature = async (req, res) => {
  try {
    const { problemId } = req.params;
    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "Invalid problem ID", message: "Invalid problem ID" });
    }

    const userId = req.result._id;
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found", message: "Problem not found" });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `leetcode-solutions/${problemId}/${userId}_${timestamp}`;

    const uploadParams = {
      timestamp: timestamp,
      public_id: publicId,
    };

    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      process.env.CLOUDINARY_API_SECRET
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
    const { problemId, cloudinaryPublicId, secureUrl, duration } = req.body;

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

    // Verify upload with Cloudinary
    let cloudinaryResource = null;
    try {
      cloudinaryResource = await cloudinary.api.resource(cloudinaryPublicId, {
        resource_type: "video",
      });
    } catch (err) {
      console.warn("Cloudinary verification warning:", err.message);
    }

    const thumbnailUrl = cloudinary.url(cloudinaryPublicId, {
      resource_type: "video",
      format: "jpg",
      transformation: [
        { width: 400, height: 225, crop: "fill" },
        { quality: "auto" },
        { start_offset: "auto" },
      ],
    });

    // Upsert so updating/replacing a video is seamless
    const videoSolution = await SolutionVideo.findOneAndUpdate(
      { problemId },
      {
        problemId,
        userId,
        videoType: "cloudinary",
        cloudinaryPublicId,
        secureUrl,
        duration: cloudinaryResource?.duration || duration || 0,
        thumbnailUrl,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      message: "Video saved successfully",
      videoSolution: {
        id: videoSolution._id,
        videoType: "cloudinary",
        secureUrl: videoSolution.secureUrl,
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

/**
 * Attach or update a YouTube video walkthrough for a problem.
 * Expects: { problemId: string, youtubeUrl: string }
 */
const saveYouTubeVideo = async (req, res) => {
  try {
    const { problemId, youtubeUrl } = req.body;

    if (!problemId || !youtubeUrl) {
      return res.status(400).json({
        error: "problemId and youtubeUrl are required",
        message: "problemId and youtubeUrl are required",
      });
    }

    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "Invalid problem ID", message: "Invalid problem ID" });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found", message: "Problem not found" });
    }

    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({
        error: "Invalid YouTube URL",
        message: "Please enter a valid YouTube video URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)",
      });
    }

    const userId = req.result._id;
    const cleanWatchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    const syntheticPublicId = `youtube_${videoId}_${problemId}`;

    // Upsert into SolutionVideo
    const videoSolution = await SolutionVideo.findOneAndUpdate(
      { problemId },
      {
        problemId,
        userId,
        videoType: "youtube",
        cloudinaryPublicId: syntheticPublicId,
        secureUrl: cleanWatchUrl,
        youtubeUrl: cleanWatchUrl,
        youtubeVideoId: videoId,
        thumbnailUrl,
        duration: 0,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      message: "YouTube video linked successfully",
      videoSolution: {
        id: videoSolution._id,
        videoType: "youtube",
        secureUrl: videoSolution.secureUrl,
        embedUrl,
        youtubeVideoId: videoId,
        thumbnailUrl: videoSolution.thumbnailUrl,
        uploadedAt: videoSolution.createdAt,
      },
    });
  } catch (error) {
    console.error("Error saving YouTube video:", error.message);
    res.status(500).json({ error: "Failed to save YouTube video", message: error.message });
  }
};

/**
 * Fetch video metadata for a single problem
 */
const getVideoByProblem = async (req, res) => {
  try {
    const { problemId } = req.params;
    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "Invalid problem ID", message: "Invalid problem ID" });
    }

    const video = await SolutionVideo.findOne({ problemId });
    if (!video) {
      return res.status(200).json({ video: null });
    }

    const videoId = video.youtubeVideoId || extractYouTubeId(video.secureUrl);
    const isYouTube = video.videoType === "youtube" || Boolean(videoId);

    res.status(200).json({
      video: {
        id: video._id,
        problemId: video.problemId,
        videoType: isYouTube ? "youtube" : "cloudinary",
        secureUrl: video.secureUrl,
        youtubeVideoId: videoId,
        embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : null,
        thumbnailUrl: video.thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null),
        duration: video.duration,
        createdAt: video.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching video for problem:", error.message);
    res.status(500).json({ error: "Failed to fetch video", message: error.message });
  }
};

/**
 * Fetch all problem IDs that have videos attached
 */
const getAllVideos = async (req, res) => {
  try {
    const videos = await SolutionVideo.find({})
      .select("problemId videoType secureUrl youtubeVideoId thumbnailUrl")
      .lean();

    const videoMap = {};
    for (const v of videos) {
      const pid = v.problemId.toString();
      const ytId = v.youtubeVideoId || extractYouTubeId(v.secureUrl);
      videoMap[pid] = {
        videoType: v.videoType || (ytId ? "youtube" : "cloudinary"),
        secureUrl: v.secureUrl,
        thumbnailUrl: v.thumbnailUrl,
        youtubeVideoId: ytId,
      };
    }

    res.status(200).json({ videos: videoMap, count: videos.length });
  } catch (error) {
    console.error("Error fetching all videos:", error.message);
    res.status(500).json({ error: "Failed to fetch videos", message: error.message });
  }
};

const deleteVideo = async (req, res) => {
  try {
    const { problemId } = req.params;
    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "Invalid problem ID", message: "Invalid problem ID" });
    }

    const video = await SolutionVideo.findOneAndDelete({ problemId });
    if (!video) {
      return res.status(404).json({ error: "Video not found", message: "Video not found" });
    }

    // Only invoke Cloudinary if it's an actual Cloudinary asset
    if (
      video.videoType === "cloudinary" &&
      video.cloudinaryPublicId &&
      !video.cloudinaryPublicId.startsWith("youtube_")
    ) {
      try {
        await cloudinary.uploader.destroy(video.cloudinaryPublicId, {
          resource_type: "video",
        });
      } catch (cErr) {
        console.warn("Cloudinary cleanup warning (non-fatal):", cErr.message);
      }
    }

    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error.message);
    res.status(500).json({ error: "Failed to delete video", message: "Failed to delete video" });
  }
};

module.exports = {
  extractYouTubeId,
  generateUploadSignature,
  saveVideoMetadata,
  saveYouTubeVideo,
  getVideoByProblem,
  getAllVideos,
  deleteVideo,
};
