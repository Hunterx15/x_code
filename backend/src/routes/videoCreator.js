const express = require("express");
const adminMiddleware = require("../middleware/adminMiddleware");
const videoRouter = express.Router();
const {
  generateUploadSignature,
  saveVideoMetadata,
  saveYouTubeVideo,
  getVideoByProblem,
  getAllVideos,
  deleteVideo,
} = require("../controllers/videoSection");

// Public/authenticated view of all attached videos map
videoRouter.get("/all", getAllVideos);
videoRouter.get("/problem/:problemId", getVideoByProblem);

// Admin-only endpoints
videoRouter.get("/create/:problemId", adminMiddleware, generateUploadSignature);
videoRouter.post("/save", adminMiddleware, saveVideoMetadata);
videoRouter.post("/save-youtube", adminMiddleware, saveYouTubeVideo);
videoRouter.delete("/delete/:problemId", adminMiddleware, deleteVideo);

module.exports = videoRouter;
