import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, NavLink, useNavigate } from "react-router";
import { motion } from "framer-motion";
import axiosClient from "../utils/axiosClient";
import {
  ArrowLeft,
  Clock,
  Trophy,
  CheckCircle2,
  XCircle,
  Circle,
  Code2,
  Users,
  RefreshCw,
  ArrowRight,
  Lock,
  Radio,
  Crown,
} from "lucide-react";

// ===========================================================================
// XCODE Contest Arena — Live Timed Problem Room & Real-Time Standings
// ===========================================================================

const formatTimer = (ms) => {
  const safe = Math.max(0, ms);
  const h = Math.floor(safe / 3600000);
  const m = Math.floor((safe % 3600000) / 60000);
  const s = Math.floor((safe % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const ContestArena = () => {
  const { contestId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isVirtual = searchParams.get("virtual") === "true";

  const [arena, setArena] = useState(null);
  const [standings, setStandings] = useState([]);
  const [activeTab, setActiveTab] = useState("problems");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Virtual personal timer (persisted per contest in sessionStorage)
  const [virtualEndMs] = useState(() => {
    const key = `xcode:virtual_end:${contestId}`;
    const saved = sessionStorage.getItem(key);
    if (saved && Number(saved) > Date.now()) return Number(saved);
    const end = Date.now() + 90 * 60 * 1000;
    sessionStorage.setItem(key, String(end));
    return end;
  });

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchArena = useCallback(async () => {
    try {
      setRefreshing(true);
      const [arenaRes, lbRes] = await Promise.all([
        axiosClient.get(`/contest/${contestId}/arena${isVirtual ? "?virtual=true" : ""}`),
        axiosClient.get(`/contest/${contestId}/leaderboard`).catch(() => ({ data: { standings: [] } })),
      ]);
      setArena(arenaRes.data);
      setStandings(lbRes.data?.standings || []);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load contest arena");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [contestId, isVirtual]);

  useEffect(() => {
    fetchArena();
  }, [fetchArena]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-6 w-6 rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }

  if (error || !arena) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-sm text-[var(--danger)]">{error || "Contest not found."}</p>
        <NavLink to="/contests" className="btn-secondary !text-xs inline-flex">
          <ArrowLeft size={13} /> Back to Contests
        </NavLink>
      </div>
    );
  }

  const { contest, locked, problems, userScore = 0, maxScore = 18 } = arena;
  const targetEndMs = isVirtual ? virtualEndMs : new Date(contest.endTime).getTime();
  const remainingMs = targetEndMs - now;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-grid-subtle">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8 space-y-6">
        {/* Top Back Nav */}
        <div className="flex items-center justify-between">
          <NavLink
            to="/contests"
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={14} /> All Contests
          </NavLink>
          <button
            onClick={fetchArena}
            disabled={refreshing}
            className="btn-ghost !text-xs !py-1.5 !px-2.5 text-[var(--text-secondary)]"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} /> Refresh Scores
          </button>
        </div>

        {/* ================================================================
            CONTEST ARENA HEADER
            ================================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface rounded-2xl p-6 border border-[var(--border-default)] flex flex-col lg:flex-row lg:items-center justify-between gap-5"
        >
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {isVirtual ? (
                <span className="pill text-[10px] bg-purple-500/15 text-purple-300 border-purple-500/30">
                  Virtual Practice Mode
                </span>
              ) : contest.status === "live" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold uppercase">
                  <Radio size={10} className="animate-pulse" /> Live Round
                </span>
              ) : (
                <span className="pill text-[10px] uppercase">{contest.status}</span>
              )}
              <span className="text-xs text-[var(--text-tertiary)]">
                {contest.durationMinutes} min · {problems.length} Problems
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              {contest.title}
            </h1>
          </div>

          {/* Live Timer & Score Pills */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-center min-w-[130px]">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] flex items-center justify-center gap-1">
                <Clock size={10} /> Time Remaining
              </div>
              <div className="text-lg font-bold font-mono text-[var(--text-primary)] mt-0.5">
                {remainingMs > 0 ? formatTimer(remainingMs) : "00:00:00"}
              </div>
            </div>

            {!locked && (
              <div className="px-4 py-2.5 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/30 text-center min-w-[120px]">
                <div className="text-[10px] uppercase tracking-wider text-[var(--accent)] flex items-center justify-center gap-1">
                  <Trophy size={10} /> Your Score
                </div>
                <div className="text-lg font-bold font-mono text-[var(--text-primary)] mt-0.5">
                  {userScore} <span className="text-xs text-[var(--text-tertiary)]">/ {maxScore}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ================================================================
            LOCKED UPCOMING STATE
            ================================================================ */}
        {locked ? (
          <div className="surface rounded-2xl p-12 text-center border border-[var(--border-default)] space-y-4">
            <Lock size={32} className="mx-auto text-amber-400" />
            <h2 className="text-lg font-semibold">Contest Has Not Started Yet</h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
              Problems unlock automatically at{" "}
              <span className="font-mono text-[var(--text-primary)]">
                {new Date(contest.startTime).toLocaleString()}
              </span>
              . Want to practice right away instead?
            </p>
            <button
              onClick={() => navigate(`/contests/${contestId}?virtual=true`)}
              className="btn-primary !text-xs"
            >
              Start Timed Virtual Practice Now
            </button>
          </div>
        ) : (
          <>
            {/* Tabs: Problems | Live Standings */}
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
              <button
                onClick={() => setActiveTab("problems")}
                className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
                  activeTab === "problems"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)]"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                }`}
              >
                <Code2 size={14} /> Contest Problems ({problems.length})
              </button>
              <button
                onClick={() => setActiveTab("standings")}
                className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
                  activeTab === "standings"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)]"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                }`}
              >
                <Users size={14} /> Live Standings ({standings.length})
              </button>
            </div>

            {/* ============================================================
                TAB 1 — PROBLEMS GRID
                ============================================================ */}
            {activeTab === "problems" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {problems.map((p) => (
                  <div
                    key={p._id}
                    onClick={() =>
                      navigate(`/problem/${p._id}?contestId=${contestId}${isVirtual ? "&virtual=true" : ""}`)
                    }
                    className={`surface rounded-2xl p-5 border transition-all cursor-pointer group flex flex-col justify-between ${
                      p.solved
                        ? "border-emerald-500/35 bg-gradient-to-br from-emerald-500/5 to-[var(--bg-surface)]"
                        : "border-[var(--border-default)] hover:border-[var(--accent)]/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]">
                            {p.label}
                          </span>
                          <span
                            className={`pill text-[10px] !py-0.5 ${
                              p.difficulty === "easy"
                                ? "badge-difficulty-easy"
                                : p.difficulty === "medium"
                                ? "badge-difficulty-medium"
                                : "badge-difficulty-hard"
                            }`}
                          >
                            {p.difficulty}
                          </span>
                          <span className="pill text-[10px] !py-0.5">{p.tags}</span>
                        </div>
                        <span className="font-mono text-xs font-semibold text-amber-400">
                          {p.points} pts
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors mb-3">
                        {p.title}
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        {p.solved ? (
                          <>
                            <CheckCircle2 size={14} className="text-[var(--success)]" />
                            <span className="text-[var(--success)] font-medium">Solved</span>
                          </>
                        ) : p.attempts > 0 ? (
                          <>
                            <XCircle size={14} className="text-[var(--danger)]" />
                            <span className="text-[var(--danger)]">{p.attempts} failed attempts</span>
                          </>
                        ) : (
                          <>
                            <Circle size={14} className="text-[var(--text-muted)]" />
                            <span className="text-[var(--text-tertiary)]">Not attempted</span>
                          </>
                        )}
                      </div>
                      <span className="text-[var(--accent)] font-medium inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        {p.solved ? "Review Code" : "Solve Problem"} <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ============================================================
                TAB 2 — LIVE STANDINGS TABLE
                ============================================================ */}
            {activeTab === "standings" && (
              <div className="surface rounded-2xl border border-[var(--border-default)] overflow-x-auto">
                {standings.length === 0 ? (
                  <div className="py-14 text-center text-xs text-[var(--text-tertiary)]">
                    No submissions yet in this contest. Be the first to solve Q1 and take #1!
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">
                        <th className="px-4 py-3 w-14">Rank</th>
                        <th className="px-4 py-3">Participant</th>
                        <th className="px-4 py-3 text-right">Score</th>
                        <th className="px-4 py-3 text-right">Penalty</th>
                        {problems.map((p) => (
                          <th key={p._id} className="px-3 py-3 text-center">
                            {p.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
                      {standings.map((row) => (
                        <tr
                          key={row.userId}
                          className="hover:bg-[var(--bg-surface-hover)] transition-colors"
                        >
                          <td className="px-4 py-3 font-mono font-semibold">
                            {row.rank === 1 ? (
                              <Crown size={15} className="text-amber-400" />
                            ) : (
                              `#${row.rank}`
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <NavLink
                              to={`/profile/${row.userId}`}
                              className="font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                            >
                              {row.firstName} {row.lastName}
                            </NavLink>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-amber-400">
                            {row.totalScore}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[var(--text-secondary)]">
                            {row.penaltyMinutes}m
                          </td>
                          {row.problemResults.map((pr) => (
                            <td key={pr.problemId} className="px-3 py-3 text-center font-mono">
                              {pr.status === "accepted" ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[11px]">
                                  ✓ {pr.solveMinute}m
                                  {pr.wrongCount > 0 ? ` (-${pr.wrongCount})` : ""}
                                </span>
                              ) : pr.status === "wrong" ? (
                                <span className="text-rose-400 text-[11px]">
                                  ✗ ({pr.wrongCount})
                                </span>
                              ) : (
                                <span className="text-[var(--text-muted)]">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ContestArena;
