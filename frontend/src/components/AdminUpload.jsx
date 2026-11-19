import { useParams, NavLink } from "react-router";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import axiosClient from "../utils/axiosClient";
import {
  Youtube,
  UploadCloud,
  Film,
  ExternalLink,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

/**
 * Extracts 11-char YouTube ID from any YouTube URL format or raw ID.
 */
const extractYouTubeId = (url) => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
};

function AdminUpload() {
  const { problemId } = useParams();

  const [activeTab, setActiveTab] = useState("youtube"); // "youtube" | "cloudinary"
  const [problem, setProblem] = useState(null);
  const [existingVideo, setExistingVideo] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // YouTube Attachment Form State
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [savingYoutube, setSavingYoutube] = useState(false);
  const [youtubeSuccess, setYoutubeSuccess] = useState(null);
  const [youtubeError, setYoutubeError] = useState(null);

  // Cloudinary Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setError,
    clearErrors,
  } = useForm();

  const selectedFile = watch("videoFile")?.[0];

  // Fetch problem details & current video on mount
  useEffect(() => {
    fetchProblemAndVideo();
  }, [problemId]);

  const fetchProblemAndVideo = async () => {
    try {
      setLoadingInitial(true);
      const [probRes, vidRes] = await Promise.all([
        axiosClient.get(`/problem/getProblemById/${problemId}`).catch(() => ({ data: null })),
        axiosClient.get(`/video/problem/${problemId}`).catch(() => ({ data: { video: null } })),
      ]);

      if (probRes?.data) {
        setProblem(probRes.data);
      }
      if (vidRes?.data?.video) {
        setExistingVideo(vidRes.data.video);
        if (vidRes.data.video.videoType === "youtube" && vidRes.data.video.secureUrl) {
          setYoutubeUrl(vidRes.data.video.secureUrl);
        }
      } else if (probRes?.data?.secureUrl) {
        // Fallback from problem response
        setExistingVideo({
          secureUrl: probRes.data.secureUrl,
          thumbnailUrl: probRes.data.thumbnailUrl,
          duration: probRes.data.duration,
          videoType: probRes.data.videoType,
          youtubeVideoId: probRes.data.youtubeVideoId,
        });
      }
    } catch (err) {
      console.error("Failed to load problem/video:", err);
    } finally {
      setLoadingInitial(false);
    }
  };

  // Preview YouTube video as user types
  const previewYtId = extractYouTubeId(youtubeUrl);

  // Handle YouTube Attachment Submit
  const handleSaveYouTube = async (e) => {
    e.preventDefault();
    if (!previewYtId) {
      setYoutubeError("Please enter a valid YouTube link (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)");
      return;
    }

    setSavingYoutube(true);
    setYoutubeError(null);
    setYoutubeSuccess(null);

    try {
      const res = await axiosClient.post("/video/save-youtube", {
        problemId,
        youtubeUrl: youtubeUrl.trim(),
      });

      setExistingVideo(res.data.videoSolution);
      setYoutubeSuccess("YouTube video successfully attached to this problem!");
    } catch (err) {
      console.error("Save YouTube error:", err);
      setYoutubeError(err.response?.data?.message || err.response?.data?.error || "Failed to save YouTube video link");
    } finally {
      setSavingYoutube(false);
    }
  };

  // Delete Video
  const handleDeleteVideo = async () => {
    if (!window.confirm("Are you sure you want to delete the video solution for this problem?")) return;

    setDeleting(true);
    try {
      await axiosClient.delete(`/video/delete/${problemId}`);
      setExistingVideo(null);
      setYoutubeUrl("");
      setUploadedVideo(null);
      setYoutubeSuccess(null);
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.error || "Failed to delete video");
    } finally {
      setDeleting(false);
    }
  };

  // Upload video to Cloudinary
  const onSubmitCloudinary = async (data) => {
    const file = data.videoFile[0];
    setUploading(true);
    setUploadProgress(0);
    clearErrors();

    try {
      const signatureResponse = await axiosClient.get(`/video/create/${problemId}`);
      const { signature, timestamp, public_id, api_key, upload_url } = signatureResponse.data;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("signature", signature);
      formData.append("timestamp", timestamp);
      formData.append("public_id", public_id);
      formData.append("api_key", api_key);

      const uploadResponse = await axios.post(upload_url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total;
          if (!total) return;
          const progress = Math.round((progressEvent.loaded * 100) / total);
          setUploadProgress(progress);
        },
      });

      const cloudinaryResult = uploadResponse.data;

      const metadataResponse = await axiosClient.post("/video/save", {
        problemId,
        cloudinaryPublicId: cloudinaryResult.public_id,
        secureUrl: cloudinaryResult.secure_url,
        duration: cloudinaryResult.duration,
      });

      setUploadedVideo(metadataResponse.data.videoSolution);
      setExistingVideo(metadataResponse.data.videoSolution);
      reset();
    } catch (err) {
      console.error("Upload error:", err);
      setError("root", {
        type: "manual",
        message: err.response?.data?.message || "Upload failed. Please try again.",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loadingInitial) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Top Header & Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <NavLink
            to="/admin/video"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Video Management
          </NavLink>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Film className="h-6 w-6 text-emerald-400" />
            Attach Video Solution
          </h1>
          {problem && (
            <p className="text-sm text-zinc-400 mt-1">
              For: <span className="font-semibold text-zinc-200">{problem.title}</span>{" "}
              <span className="badge badge-sm badge-outline ml-2">{problem.difficulty}</span>
            </p>
          )}
        </div>

        {problemId && (
          <NavLink
            to={`/problem/${problemId}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/80 px-3.5 py-2 text-xs font-medium text-zinc-200 transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View in Problem Page
          </NavLink>
        )}
      </div>

      {/* Currently Attached Video Banner (if any) */}
      {existingVideo && (
        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {existingVideo.thumbnailUrl ? (
                <img
                  src={existingVideo.thumbnailUrl}
                  alt="Video thumbnail"
                  className="h-16 w-28 rounded-lg object-cover border border-zinc-800"
                />
              ) : (
                <div className="flex h-16 w-28 items-center justify-center rounded-lg bg-black border border-zinc-800 text-zinc-500">
                  <Film className="h-6 w-6" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-success badge-sm">Attached</span>
                  <span className="text-xs text-zinc-400 capitalize">
                    {existingVideo.videoType || "Video"}
                  </span>
                </div>
                <a
                  href={existingVideo.secureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-sm font-medium text-zinc-200 hover:text-emerald-400 truncate max-w-sm"
                >
                  {existingVideo.secureUrl}
                </a>
              </div>
            </div>

            <button
              onClick={handleDeleteVideo}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800/60 px-3.5 py-2 text-xs font-medium text-red-200 transition-all disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete Video
            </button>
          </div>
        </div>
      )}

      {/* Mode Tabs: YouTube (Fast & Recommended) vs Cloudinary */}
      <div className="mb-6 flex rounded-xl bg-zinc-900/90 p-1 border border-zinc-800">
        <button
          onClick={() => setActiveTab("youtube")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "youtube"
              ? "bg-red-600/90 text-white shadow-lg"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Youtube className="h-4 w-4 fill-white" />
          Attach YouTube Link <span className="text-xs opacity-80">(Recommended)</span>
        </button>

        <button
          onClick={() => setActiveTab("cloudinary")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "cloudinary"
              ? "bg-emerald-600/90 text-white shadow-lg"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <UploadCloud className="h-4 w-4" />
          Upload Video File (Cloudinary)
        </button>
      </div>

      {/* TAB 1: YOUTUBE LINK ATTACHMENT */}
      {activeTab === "youtube" && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-2xl space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500 fill-red-500" />
              Attach YouTube Video Walkthrough
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Paste any YouTube video or Shorts link (e.g., NeetCode, Striver, or your own explanation).
              No file size limits or cloud bandwidth costs.
            </p>
          </div>

          <form onSubmit={handleSaveYouTube} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                YouTube Video URL or Video ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={youtubeUrl}
                  onChange={(e) => {
                    setYoutubeUrl(e.target.value);
                    setYoutubeError(null);
                    setYoutubeSuccess(null);
                  }}
                  className="w-full rounded-xl bg-black/60 border border-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Live YouTube Preview */}
            {previewYtId && (
              <div className="rounded-xl border border-zinc-800 bg-black/50 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Valid Video ID: <code className="text-zinc-200 font-mono">{previewYtId}</code>
                  </span>
                  <a
                    href={`https://www.youtube.com/watch?v=${previewYtId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-red-400 hover:underline"
                  >
                    Open on YouTube <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="relative aspect-video w-full max-w-lg mx-auto overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-lg">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${previewYtId}?rel=0`}
                    title="YouTube Preview"
                    className="h-full w-full"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Error & Success Messages */}
            {youtubeError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-950/40 border border-red-800/50 p-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{youtubeError}</span>
              </div>
            )}

            {youtubeSuccess && (
              <div className="flex items-center justify-between rounded-xl bg-emerald-950/40 border border-emerald-800/50 p-3 text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{youtubeSuccess}</span>
                </div>
                {problemId && (
                  <NavLink
                    to={`/problem/${problemId}`}
                    className="text-xs font-semibold text-emerald-400 hover:underline"
                  >
                    View Problem →
                  </NavLink>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={savingYoutube || !previewYtId}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 px-5 py-2.5 text-sm font-medium text-white transition-all shadow-lg hover:shadow-red-600/30"
              >
                {savingYoutube ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Linking Video...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Save YouTube Video
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: CLOUDINARY FILE UPLOAD */}
      {activeTab === "cloudinary" && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2 mb-2">
            <UploadCloud className="h-5 w-5 text-emerald-400" />
            Upload Raw Video File
          </h2>
          <p className="text-xs text-zinc-400 mb-6">
            Upload MP4/MOV directly to Cloudinary. Max file size: 100MB.
          </p>

          <form onSubmit={handleSubmit(onSubmitCloudinary)} className="space-y-4">
            <div className="form-control w-full">
              <input
                type="file"
                accept="video/*"
                {...register("videoFile", {
                  required: "Please select a video file",
                  validate: {
                    isVideo: (files) => {
                      if (!files || !files[0]) return "Please select a video file";
                      const file = files[0];
                      return file.type.startsWith("video/") || "Please select a valid video file";
                    },
                    fileSize: (files) => {
                      if (!files || !files[0]) return true;
                      const file = files[0];
                      const maxSize = 100 * 1024 * 1024;
                      return file.size <= maxSize || "File size must be less than 100MB";
                    },
                  },
                })}
                className={`file-input file-input-bordered w-full bg-black/60 border-zinc-800 ${
                  errors.videoFile ? "file-input-error" : ""
                }`}
                disabled={uploading}
              />
              {errors.videoFile && (
                <span className="text-xs text-red-400 mt-1">{errors.videoFile.message}</span>
              )}
            </div>

            {selectedFile && (
              <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/60 p-3 text-xs text-zinc-300">
                <p className="font-semibold">{selectedFile.name}</p>
                <p className="text-zinc-400">Size: {formatFileSize(selectedFile.size)}</p>
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Uploading to Cloudinary...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <progress
                  className="progress progress-primary w-full"
                  value={uploadProgress}
                  max="100"
                />
              </div>
            )}

            {errors.root && (
              <div className="alert alert-error text-xs">
                <span>{errors.root.message}</span>
              </div>
            )}

            {uploadedVideo && (
              <div className="alert alert-success text-xs">
                <div>
                  <h3 className="font-bold">Upload Successful!</h3>
                  <p>Duration: {formatDuration(uploadedVideo.duration)}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-5 py-2.5 text-sm font-medium text-white transition-all shadow-lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    Upload Video
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminUpload;
