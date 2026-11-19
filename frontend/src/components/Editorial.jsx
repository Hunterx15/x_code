import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router";
import {
  Play,
  Pause,
  Maximize2,
  RotateCcw,
  RotateCw,
  Loader2,
  ExternalLink,
  Youtube,
  Copy,
  Check,
  Search,
  UploadCloud,
  Film,
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

const Editorial = ({
  secureUrl,
  thumbnailUrl,
  duration = 0,
  videoType,
  youtubeVideoId,
  problemId,
  problemTitle,
  isAdmin = false,
}) => {
  const videoRef = useRef(null);
  const controlsTimeout = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Detect YouTube video
  const detectedYtId =
    youtubeVideoId ||
    extractYouTubeId(secureUrl) ||
    (videoType === "youtube" ? extractYouTubeId(secureUrl) : null);
  const isYouTube = videoType === "youtube" || Boolean(detectedYtId);

  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    if (isPlaying) {
      controlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  };

  const togglePlayPause = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (err) {
      console.error("Playback error:", err);
    }
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.currentTime + 10, video.duration || 0);
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(video.currentTime - 10, 0);
  };

  const handleFullscreen = () => {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleCopyLink = () => {
    const targetUrl = isYouTube && detectedYtId
      ? `https://www.youtube.com/watch?v=${detectedYtId}`
      : secureUrl;
    if (!targetUrl) return;

    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Event listeners for standard HTML5 video player
  useEffect(() => {
    if (isYouTube) return;
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      setIsPlaying(false);
      setShowControls(true);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setShowControls(true);
    };
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => setVideoDuration(video.duration);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
    };
  }, [isYouTube, secureUrl]);

  // Keyboard shortcuts (Space/K for Play/Pause, Left/Right for Skip)
  useEffect(() => {
    if (isYouTube) return;

    const handleKeyDown = (e) => {
      const active = document.activeElement;
      if (active?.tagName === "INPUT" || active?.tagName === "TEXTAREA") return;

      if (e.code === "Space" || e.key === "k") {
        e.preventDefault();
        togglePlayPause();
      }
      if (e.key === "ArrowRight") skipForward();
      if (e.key === "ArrowLeft") skipBackward();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isYouTube]);

  // =========================================================================
  // CASE 1: No video attached yet
  // =========================================================================
  if (!secureUrl) {
    const ytSearchQuery = encodeURIComponent(
      `${problemTitle || "DSA Problem"} leetcode solution`
    );
    const ytSearchUrl = `https://www.youtube.com/results?search_query=${ytSearchQuery}`;

    return (
      <div className="relative w-full max-w-4xl mx-auto rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/60 to-black p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-emerald-400 mb-4 shadow-inner">
          <Film className="h-8 w-8 text-emerald-400" />
        </div>

        <h3 className="text-lg font-semibold text-zinc-100">
          No Video Walkthrough Attached
        </h3>
        <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
          An official video tutorial hasn't been linked for this problem yet. You
          can search for top video explanations on YouTube or attach one if you're an admin.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href={ytSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-red-600/90 hover:bg-red-600 px-4 py-2 text-sm font-medium text-white transition-all shadow-lg hover:shadow-red-600/30"
          >
            <Youtube className="h-4 w-4 fill-white" />
            Search Solutions on YouTube
            <ExternalLink className="h-3.5 w-3.5 opacity-80" />
          </a>

          {isAdmin && problemId && (
            <NavLink
              to={`/admin/upload/${problemId}`}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 px-4 py-2 text-sm font-medium text-zinc-200 transition-all"
            >
              <UploadCloud className="h-4 w-4 text-emerald-400" />
              Attach YouTube Link
            </NavLink>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // CASE 2: YouTube Video
  // =========================================================================
  if (isYouTube && detectedYtId) {
    const watchUrl = `https://www.youtube.com/watch?v=${detectedYtId}`;

    return (
      <div className="relative w-full max-w-4xl mx-auto space-y-3">
        {/* Header Badge */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
            <span className="flex items-center gap-1.5 rounded-full bg-red-950/60 border border-red-800/40 px-2.5 py-1 text-red-300">
              <Youtube className="h-3.5 w-3.5 fill-red-500 text-red-500" />
              YouTube Walkthrough
            </span>
            {problemTitle && (
              <span className="truncate max-w-[280px] text-zinc-300">
                {problemTitle}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Copy video URL"
              className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-red-600/90 hover:bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition-all"
            >
              <ExternalLink className="h-3 w-3" />
              Watch on YouTube
            </a>
          </div>
        </div>

        {/* Embedded Iframe Player */}
        <div className="relative w-full aspect-video overflow-hidden rounded-2xl border border-zinc-800/90 bg-black shadow-2xl">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${detectedYtId}?rel=0&modestbranding=1&enablejsapi=1`}
            title={problemTitle ? `${problemTitle} Video Walkthrough` : "Editorial Video Walkthrough"}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between text-xs text-zinc-500 px-1 pt-1">
          <span>
            💡 Tip: Open in YouTube to access timestamps, author notes, and community comments.
          </span>
          {isAdmin && problemId && (
            <NavLink
              to={`/admin/upload/${problemId}`}
              className="text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              Edit Video Link
            </NavLink>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // CASE 3: Direct MP4 / Cloudinary Video Player
  // =========================================================================
  return (
    <div
      className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-2xl bg-black shadow-2xl border border-zinc-800"
      onMouseEnter={() => {
        setIsHovering(true);
        showControlsTemporarily();
      }}
      onMouseLeave={() => {
        setIsHovering(false);
        if (isPlaying) setShowControls(false);
      }}
      onMouseMove={showControlsTemporarily}
    >
      <video
        ref={videoRef}
        src={secureUrl}
        poster={thumbnailUrl}
        className="w-full aspect-video bg-black"
        onClick={togglePlayPause}
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Loader2 size={50} className="animate-spin text-white" />
        </div>
      )}

      {/* Center Play Button */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlayPause}
          className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
            <Play size={40} className="ml-1 text-white" fill="white" />
          </div>
        </button>
      )}

      {/* Bottom Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${
          showControls || isHovering
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="bg-gradient-to-t from-black via-black/70 to-transparent p-4">
          <input
            type="range"
            min={0}
            max={videoDuration || 0}
            value={currentTime}
            onChange={(e) => {
              const time = Number(e.target.value);
              setCurrentTime(time);
              if (videoRef.current) videoRef.current.currentTime = time;
            }}
            className="range range-primary range-xs w-full"
          />

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                className="btn btn-circle btn-sm btn-ghost text-white"
                onClick={togglePlayPause}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>

              <button
                className="btn btn-circle btn-sm btn-ghost text-white"
                onClick={skipBackward}
              >
                <RotateCcw size={18} />
              </button>

              <button
                className="btn btn-circle btn-sm btn-ghost text-white"
                onClick={skipForward}
              >
                <RotateCw size={18} />
              </button>

              <span className="text-sm text-white">
                {formatTime(currentTime)} / {formatTime(videoDuration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="btn btn-circle btn-sm btn-ghost text-white"
                onClick={handleCopyLink}
                title="Copy video link"
              >
                {copied ? (
                  <Check size={18} className="text-emerald-400" />
                ) : (
                  <Copy size={18} />
                )}
              </button>

              <button
                className="btn btn-circle btn-sm btn-ghost text-white"
                onClick={handleFullscreen}
              >
                <Maximize2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editorial;
