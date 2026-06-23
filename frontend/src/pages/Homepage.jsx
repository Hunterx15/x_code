import { useEffect, useState, useMemo, useCallback } from "react";
import { NavLink } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import axiosClient from "../utils/axiosClient";
import { logoutUser } from "../authSlice";
import { motion } from "framer-motion";
import {
  Search,
  CheckCircle2,
  Circle,
  Bookmark,
  Filter,
  Trophy,
  Target,
  TrendingUp,
} from "lucide-react";

// ===========================================================================
// XCODE Problems page — LeetCode-inspired with modern design.
// Uses GET /problem/getAllProblem + GET /problem/problemSolvedByUser.
// ===========================================================================

function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
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
    if (!user) { setSolvedProblems([]); return; }
    let cancelled = false;
    const fetchSolvedProblems = async () => {
      try {
        const { data } = await axiosClient.get("/problem/problemSolvedByUser");
        if (!cancelled) setSolvedProblems(data);
      } catch (error) {
        console.error("Error fetching solved problems:", error);
      }
    };
    fetchSolvedProblems();
    return () => { cancelled = true; };
  }, [user]);

  const solvedIds = useMemo(
    () => new Set(solvedProblems.map((sp) => sp._id)),
    [solvedProblems]
  );

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      const difficultyMatch =
        filters.difficulty === "all" || problem.difficulty === filters.difficulty;
      const tagMatch = filters.tag === "all" || problem.tags === filters.tag;
      const statusMatch =
        filters.status === "all" ||
        (filters.status === "solved" && solvedIds.has(problem._id)) ||
        (filters.status === "unsolved" && !solvedIds.has(problem._id));
      const searchMatch =
        !filters.search ||
        problem.title.toLowerCase().includes(filters.search.toLowerCase());
      return difficultyMatch && tagMatch && statusMatch && searchMatch;
    });
  }, [problems, filters, solvedIds]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-6 w-6 rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold tracking-tight mb-1">Problems</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Practice and master data structures & algorithms
        </p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MiniStat icon={Trophy} label="Solved" value={`${stats.solved}/${stats.total}`} color="text-[var(--accent)]" />
        <MiniStat icon={Circle} label="Easy" value={stats.easy} color="text-[var(--success)]" />
        <MiniStat icon={Circle} label="Medium" value={stats.medium} color="text-[var(--warning)]" />
        <MiniStat icon={Circle} label="Hard" value={stats.hard} color="text-[var(--danger)]" />
      </div>

      {/* Filters bar */}
      <div className="surface rounded-xl p-3 mb-4 flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search problems..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="input-field !py-2 !pl-9 text-[13px]"
          />
        </div>

        {/* Difficulty filter */}
        <select
          value={filters.difficulty}
          onChange={(e) => updateFilter("difficulty", e.target.value)}
          className="input-field !w-auto !py-2 text-[13px] cursor-pointer"
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        {/* Tag filter */}
        <select
          value={filters.tag}
          onChange={(e) => updateFilter("tag", e.target.value)}
          className="input-field !w-auto !py-2 text-[13px] cursor-pointer"
        >
          <option value="all">All Tags</option>
          <option value="array">Array</option>
          <option value="linkedList">Linked List</option>
          <option value="graph">Graph</option>
          <option value="dp">DP</option>
          <option value="math">Math</option>
          <option value="string">String</option>
          <option value="greedy">Greedy</option>
          <option value="binarySearch">Binary Search</option>
          <option value="tree">Tree</option>
          <option value="map">Map</option>
        </select>

        {/* Status filter */}
        <select
          value={filters.status}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="input-field !w-auto !py-2 text-[13px] cursor-pointer"
        >
          <option value="all">All</option>
          <option value="solved">Solved</option>
          <option value="unsolved">Unsolved</option>
        </select>
      </div>

      {/* Problems table */}
      <div className="surface rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="text-left text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium px-4 py-3 w-12">Status</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium px-4 py-3">Title</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium px-4 py-3 hidden sm:table-cell w-28">Difficulty</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium px-4 py-3 hidden md:table-cell w-28">Tags</th>
              <th className="text-right text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {filteredProblems.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-[13px] text-[var(--text-tertiary)]">
                  No problems found matching your filters.
                </td>
              </tr>
            ) : (
              filteredProblems.map((problem, index) => {
                const isSolved = solvedIds.has(problem._id);
                return (
                  <motion.tr
                    key={problem._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.01, 0.3) }}
                    className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-surface-hover)] transition-colors group cursor-pointer"
                    onClick={() => window.location.href = `/problem/${problem._id}`}
                  >
                    <td className="px-4 py-3">
                      {isSolved ? (
                        <CheckCircle2 size={16} className="text-[var(--success)]" />
                      ) : (
                        <Circle size={16} className="text-[var(--text-muted)]" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <NavLink
                        to={`/problem/${problem._id}`}
                        className="text-[13px] text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors"
                      >
                        {problem.title}
                      </NavLink>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`pill ${
                        problem.difficulty === "easy" ? "badge-difficulty-easy"
                          : problem.difficulty === "medium" ? "badge-difficulty-medium"
                          : "badge-difficulty-hard"
                      }`}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="pill">{problem.tags}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors text-[13px]">
                        →
                      </span>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="mt-4 text-[12px] text-[var(--text-tertiary)] text-center">
        Showing {filteredProblems.length} of {problems.length} problems
      </div>
    </div>
  );
}

const MiniStat = ({ icon: Icon, label, value, color }) => (
  <div className="surface rounded-lg p-3 flex items-center gap-2.5">
    <Icon size={15} className={color} />
    <div>
      <div className={`text-[15px] font-semibold ${color}`}>{value}</div>
      <div className="text-[10px] text-[var(--text-tertiary)]">{label}</div>
    </div>
  </div>
);

export default Homepage;
