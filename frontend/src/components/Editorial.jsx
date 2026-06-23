import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Maximize2,
  RotateCcw,
  RotateCw,
  Loader2,
} from "lucide-react";

const Editorial = ({ secureUrl, thumbnailUrl, duration = 0 }) => {
  const videoRef = useRef(null);
  const controlsTimeout = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      console.error(err);
    }
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.min(
      video.currentTime + 10,
      video.duration
    );
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(
      video.currentTime - 10,
      0
    );
  };

  const handleFullscreen = () => {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const onPlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      showControlsTemporarily();
    };

    const onPause = () => {
      setIsPlaying(false);
      setShowControls(true);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setShowControls(true);
    };

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const onLoadedMetadata = () => {
      setVideoDuration(video.duration);
    };

    const onWaiting = () => {
      setIsLoading(true);
    };

    const onCanPlay = () => {
      setIsLoading(false);
    };

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
      video.removeEventListener(
        "loadedmetadata",
        onLoadedMetadata
      );
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;

      if (
        active?.tagName === "INPUT" ||
        active?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Space" || e.key === "k") {
        e.preventDefault();
        togglePlayPause();
      }

      if (e.key === "ArrowRight") {
        skipForward();
      }

      if (e.key === "ArrowLeft") {
        skipBackward();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-2xl bg-black shadow-2xl"
      onMouseEnter={() => {
        setIsHovering(true);
        showControlsTemporarily();
      }}
      onMouseLeave={() => {
        setIsHovering(false);

        if (isPlaying) {
          setShowControls(false);
        }
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
          <Loader2
            size={50}
            className="animate-spin text-white"
          />
        </div>
      )}

      {/* Center Play Button */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlayPause}
          className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
            <Play
              size={40}
              className="ml-1 text-white"
              fill="white"
            />
          </div>
        </button>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${
          showControls || isHovering
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}
      >
        <div className="bg-gradient-to-t from-black via-black/70 to-transparent p-4">
          {/* Progress */}
          <input
            type="range"
            min={0}
            max={videoDuration || 0}
            value={currentTime}
            onChange={(e) => {
              const time = Number(e.target.value);

              setCurrentTime(time);

              if (videoRef.current) {
                videoRef.current.currentTime = time;
              }
            }}
            className="range range-primary range-xs w-full"
          />

          {/* Controls Row */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                className="btn btn-circle btn-sm btn-ghost text-white"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} />
                )}
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
                {formatTime(currentTime)} /{" "}
                {formatTime(videoDuration)}
              </span>
            </div>

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
  );
};

export default Editorial;