import { useEffect, useState } from "react";
import axiosClient from "../utils/axiosClient";
import { NavLink } from "react-router";
import {
  Film,
  Youtube,
  Trash2,
  ExternalLink,
  UploadCloud,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

const AdminVideo = () => {
  const [problems, setProblems] = useState([]);
  const [videosMap, setVideosMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [problemsRes, videosRes] = await Promise.all([
        axiosClient.get("/problem/getAllProblem"),
        axiosClient.get("/video/all").catch(() => ({ data: { videos: {} } })),
      ]);

      setProblems(problemsRes.data || []);
      setVideosMap(videosRes.data?.videos || {});
    } catch (err) {
      setError("Failed to fetch problems");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (problemId) => {
    if (!window.confirm("Are you sure you want to delete the video solution for this problem?")) return;

    try {
      setDeletingId(problemId);
      await axiosClient.delete(`/video/delete/${problemId}`);
      // Update videosMap to remove this problem's video
      setVideosMap((prev) => {
        const next = { ...prev };
        delete next[problemId];
        return next;
      });
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to delete video");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProblems = problems.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.title || "").toLowerCase().includes(q) ||
      (p.tags || "").toLowerCase().includes(q) ||
      (p.difficulty || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-72">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Film className="h-6 w-6 text-emerald-400" />
            Video Walkthrough Management
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Attach YouTube tutorials or Cloudinary walkthroughs to any problem in the catalog.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search problems or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-black/60 border border-zinc-800 pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4 text-xs">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/40 shadow-2xl">
        <table className="table w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="w-12">#</th>
              <th>Title</th>
              <th>Difficulty</th>
              <th>Tags</th>
              <th>Attached Video</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProblems.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-zinc-500">
                  No problems matching "{searchQuery}"
                </td>
              </tr>
            ) : (
              filteredProblems.map((problem, index) => {
                const vid = videosMap[problem._id];
                const isYt = vid?.videoType === "youtube" || vid?.youtubeVideoId;

                return (
                  <tr
                    key={problem._id}
                    className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="text-zinc-500 font-mono">{index + 1}</td>
                    <td className="font-medium text-zinc-200">
                      <NavLink
                        to={`/problem/${problem._id}`}
                        className="hover:text-emerald-400 hover:underline flex items-center gap-1.5"
                      >
                        {problem.title}
                        <ExternalLink className="h-3 w-3 opacity-40 hover:opacity-100" />
                      </NavLink>
                    </td>
                    <td>
                      <span
                        className={`badge badge-sm font-medium ${
                          (problem.difficulty || "").toLowerCase() === "easy"
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                            : (problem.difficulty || "").toLowerCase() === "medium"
                            ? "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                            : "bg-red-950/60 text-red-400 border border-red-800/40"
                        }`}
                      >
                        {problem.difficulty}
                      </span>
                    </td>
                    <td>
                      <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-zinc-300 font-mono text-[11px]">
                        {problem.tags}
                      </span>
                    </td>
                    <td>
                      {vid ? (
                        <div className="flex items-center gap-2">
                          {isYt ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-red-950/50 border border-red-800/40 px-2 py-0.5 text-[11px] font-medium text-red-300">
                              <Youtube className="h-3 w-3 fill-red-500 text-red-500" />
                              YouTube
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-sky-950/50 border border-sky-800/40 px-2 py-0.5 text-[11px] font-medium text-sky-300">
                              <Film className="h-3 w-3 text-sky-400" />
                              Cloudinary
                            </span>
                          )}
                          <a
                            href={vid.secureUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-zinc-200"
                            title="Open video link"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-zinc-500 italic text-[11px]">
                          No Video
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <NavLink
                          to={`/admin/upload/${problem._id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 px-2.5 py-1 text-xs text-zinc-200 transition-all"
                        >
                          <UploadCloud className="h-3 w-3 text-emerald-400" />
                          {vid ? "Edit" : "Attach"}
                        </NavLink>

                        {vid && (
                          <button
                            onClick={() => handleDeleteVideo(problem._id)}
                            disabled={deletingId === problem._id}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-950/40 hover:bg-red-900 border border-red-800/40 px-2 py-1 text-xs text-red-300 transition-all disabled:opacity-50"
                            title="Delete video"
                          >
                            {deletingId === problem._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminVideo;
