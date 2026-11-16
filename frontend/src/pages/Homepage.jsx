import { useEffect, useState, useMemo, useCallback } from "react";
import { NavLink, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import axiosClient from "../utils/axiosClient";
import { motion } from "framer-motion";
import {
  Search,
  CheckCircle2,
  Circle,
  Bookmark,
  Heart,
  Trophy,
  Target,
  Sparkles,
  ArrowRight,
  Shuffle,
  X,
  Code2,
} from "lucide-react";

// ===========================================================================
// XCODE Problems Catalog — Modern, Fast, and Clean
// ===========================================================================

function Homepage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    difficulty: "all",
    tag: "all",
    status: "all",
    search: "",
  });

  useEffect(() => {
    let cancelled = false;
    const fetchProblems = async () => {
      try {
        const { data } = await axiosClient.get("/problem/getAllProblem");
        if (!cancelled) {
          setProblems(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching problems:", error);
        if (!cancelled) setLoading(false);
      }
    };
    fetchProblems();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user) {
      setSolvedProblems([]);
      setBookmarks([]);
      setFavorites([]);
      return;
    }
    let cancelled = false;
    const fetchUserData = async () => {
      try {
        const [solvedRes, bmRes, favRes] = await Promise.all([
          axiosClient.get("/problem/problemSolvedByUser"),
          axiosClient.get("/user/bookmarks").catch(() => ({ data: { bookmarks: [] } })),
          axiosClient.get("/user/favorites").catch(() => ({ data: { favorites: [] } })),
        ]);
        if (!cancelled) {
          setSolvedProblems(solvedRes.data || []);
          setBookmarks(bmRes.data.bookmarks || []);
          setFavorites(favRes.data.favorites || []);
        }
      } catch (error) {
        console.error("Error fetching user problem status:", error);
      }
    };
    fetchUserData();
    return () => { cancelled = true; };
  }, [user]);

  const solvedIds = useMemo(
    () => new Set(solvedProblems.map((sp) => sp._id)),
    [solvedProblems]
  );
  const bookmarkIds = useMemo(
    () => new Set(bookmarks.map((b) => b._id)),
    [bookmarks]
  );
  const favoriteIds = useMemo(
    () => new Set(favorites.map((f) => f._id)),
    [favorites]
  );

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      const difficultyMatch =
        filters.difficulty === "all" || problem.difficulty === filters.difficulty;
      const tagMatch = filters.tag === "all" || problem.tags === filters.tag;
      const statusMatch =
        filters.status === "all" ||
        (filters.status === "solved" && solvedIds.has(problem._id)) ||
        (filters.status === "unsolved" && !solvedIds.has(problem._id)) ||
        (filters.status === "bookmarked" && bookmarkIds.has(problem._id)) ||
        (filters.status === "favorite" && favoriteIds.has(problem._id));
      const searchMatch =
        !filters.search ||
        problem.title.toLowerCase().includes(filters.search.toLowerCase());
      return difficultyMatch && tagMatch && statusMatch && searchMatch;
    });
  }, [problems, filters, solvedIds, bookmarkIds, favoriteIds]);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const stats = useMemo(() => ({
    total: problems.length,
    solved: solvedProblems.length,
    easy: solvedProblems.filter((p) => p.difficulty === "easy").length,
    medium: solvedProblems.filter((p) => p.difficulty === "medium").length,
    hard: solvedProblems.filter((p) => p.difficulty === "hard").length,
  }), [problems, solvedProblems]);

  const handlePickRandom = useCallback(() => {
    if (problems.length === 0) return;
    const random = problems[Math.floor(Math.random() * problems.length)];
    if (random?._id) navigate(`/problem/${random._id}`);
  }, [problems, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-6 w-6 rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }

  const solvedPct = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8 space-y-6">

      {/* ================================================================
          HEADER & PROGRESS SUMMARY
          ================================================================ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1 flex items-center gap-2">
            Problems Directory
          </h1>
          <p className="text-xs text-[var(--text-tertiary)]">
            Explore curated data structures and algorithms challenges
          </p>
        </div>

        {/* Action: Pick Random */}
        <button
          onClick={handlePickRandom}
          className="btn-secondary !text-xs !py-2 !px-3.5 flex items-center gap-2 self-start md:self-auto hover:border-[var(--accent)] transition-colors"
        >
          <Shuffle size={13} className="text-[var(--accent)]" /> Surprise Me (Random)
        </button>
      </div>

      {/* Progress banner card */}
      <div className="surface p-4 rounded-xl border border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] flex-shrink-0">
            <Trophy size={18} />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-[var(--text-primary)]">
                {stats.solved} of {stats.total} Solved
              </span>
              <span className="text-xs text-[var(--text-tertiary)] font-mono">({solvedPct}%)</span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {stats.easy} Easy · {stats.medium} Medium · {stats.hard} Hard
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full sm:w-64 space-y-1">
          <div className="h-2 w-full rounded-full bg-[var(--bg-elevated)] overflow-hidden flex">
            <div
              className="bg-[var(--success)] h-full transition-all duration-500"
              style={{ width: `${stats.total > 0 ? (stats.easy / stats.total) * 100 : 0}%` }}
              title={`Easy: ${stats.easy}`}
            />
            <div
              className="bg-[var(--warning)] h-full transition-all duration-500"
              style={{ width: `${stats.total > 0 ? (stats.medium / stats.total) * 100 : 0}%` }}
              title={`Medium: ${stats.medium}`}
            />
            <div
              className="bg-[var(--danger)] h-full transition-all duration-500"
              style={{ width: `${stats.total > 0 ? (stats.hard / stats.total) * 100 : 0}%` }}
              title={`Hard: ${stats.hard}`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
            <span>Overall completion</span>
            <span className="font-mono">{solvedPct}%</span>
          </div>
        </div>
      </div>

      {/* ================================================================
          CURATED STUDY TRACKS / ROADMAPS
          ================================================================ */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        {[
          { label: "All Topics", tag: "all", icon: "🌐" },
          { label: "Arrays & Hashing", tag: "array", icon: "📦" },
          { label: "Trees & Graphs", tag: "graph", icon: "🌲" },
          { label: "Dynamic Programming", tag: "dp", icon: "⚡" },
          { label: "Binary Search", tag: "binarySearch", icon: "🎯" },
          { label: "Linked Lists", tag: "linkedList", icon: "🔗" },
          { label: "Math & Logic", tag: "math", icon: "📐" },
        ].map((track) => (
          <button
            key={track.tag}
            onClick={() => updateFilter("tag", track.tag)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filters.tag === track.tag
                ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)] shadow-sm"
                : "surface border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>{track.icon}</span>
            <span>{track.label}</span>
          </button>
        ))}
      </div>

      {/* ================================================================
          SEARCH & INTERACTIVE FILTER PILLS
          ================================================================ */}
      <div className="space-y-3">
        {/* Search Bar + Tag Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by problem title..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="input-field !py-2.5 !pl-9 !pr-8 text-xs w-full"
            />
            {filters.search && (
              <button
                onClick={() => updateFilter("search", "")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Tag Dropdown */}
          <select
            value={filters.tag}
            onChange={(e) => updateFilter("tag", e.target.value)}
            className="input-field !w-full sm:!w-44 !py-2.5 text-xs cursor-pointer"
          >
            <option value="all">All Topics</option>
            <option value="array">Array</option>
            <option value="linkedList">Linked List</option>
            <option value="graph">Graph</option>
            <option value="dp">Dynamic Prog</option>
            <option value="math">Math</option>
            <option value="string">String</option>
            <option value="greedy">Greedy</option>
            <option value="binarySearch">Binary Search</option>
            <option value="tree">Tree</option>
            <option value="map">Map</option>
          </select>
        </div>

        {/* Filter Pills Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Difficulty Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-[var(--text-tertiary)] mr-1">Difficulty:</span>
            {[
              { id: "all", label: "All" },
              { id: "easy", label: "Easy", color: "text-[var(--success)]" },
              { id: "medium", label: "Medium", color: "text-[var(--warning)]" },
              { id: "hard", label: "Hard", color: "text-[var(--danger)]" },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => updateFilter("difficulty", d.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  filters.difficulty === d.id
                    ? "bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--text-primary)] shadow-sm"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                }`}
              >
                <span className={d.color}>{d.label}</span>
              </button>
            ))}
          </div>

          {/* Status Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-[var(--text-tertiary)] mr-1">Status:</span>
            {[
              { id: "all", label: "All" },
              { id: "solved", label: "Solved", icon: CheckCircle2 },
              { id: "unsolved", label: "Unsolved" },
              { id: "bookmarked", label: "Bookmarked", icon: Bookmark },
              { id: "favorite", label: "Favorites", icon: Heart },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => updateFilter("status", s.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
                    filters.status === s.id
                      ? "bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--accent)] shadow-sm"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                  }`}
                >
                  {Icon && <Icon size={11} />}
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================================================================
          PROBLEMS TABLE
          ================================================================ */}
      <div className="surface rounded-xl border border-[var(--border-default)] overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50">
              <th className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium px-4 py-3 w-12 text-center">Status</th>
              <th className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium px-4 py-3">Title</th>
              <th className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium px-4 py-3 hidden sm:table-cell w-28">Difficulty</th>
              <th className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium px-4 py-3 hidden md:table-cell w-36">Tags</th>
              <th className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium px-4 py-3 w-14 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {filteredProblems.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-14 text-xs text-[var(--text-tertiary)]">
                  <Code2 size={24} className="text-[var(--text-muted)] mx-auto mb-2" />
                  No problems matched your current filters.
                </td>
              </tr>
            ) : (
              filteredProblems.map((problem) => {
                const isSolved = solvedIds.has(problem._id);
                return (
                  <tr
                    key={problem._id}
                    onClick={() => navigate(`/problem/${problem._id}`)}
                    className="hover:bg-[var(--bg-surface-hover)] transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-3.5 text-center">
                      {isSolved ? (
                        <CheckCircle2 size={16} className="text-[var(--success)] inline-block" />
                      ) : (
                        <Circle size={15} className="text-[var(--border-strong)] inline-block group-hover:text-[var(--text-muted)] transition-colors" />
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                          {problem.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className={`pill text-[10px] !py-0.5 ${
                        problem.difficulty === "easy" ? "badge-difficulty-easy"
                          : problem.difficulty === "medium" ? "badge-difficulty-medium"
                          : "badge-difficulty-hard"
                      }`}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="pill text-[10px] !py-0.5">{problem.tags}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 inline-block transition-all text-xs">
                        →
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="text-[11px] text-[var(--text-tertiary)] text-center pt-1">
        Showing {filteredProblems.length} of {problems.length} problems
      </div>
    </div>
  );
}

export default Homepage;