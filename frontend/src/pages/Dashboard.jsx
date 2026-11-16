import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import axiosClient from "../utils/axiosClient";
import ActivityGraph from "../components/ActivityGraph";
import {
  Flame,
  Trophy,
  TrendingUp,
  Target,
  Sparkles,
  Code2,
  Clock,
  ArrowRight,
  Play,
  Activity,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Bookmark,
} from "lucide-react";

// ===========================================================================
// XCODE Dashboard — Sleek, High-Impact Developer Workspace
// Focused strictly on high-utility components:
//   1. Command Hero (Key metrics + direct CTA)
//   2. Daily Challenge & Continue Learning
//   3. Solving Progress & 90-Day Activity Heatmap
//   4. Recommended Problems & Live Submissions Feed
// ===========================================================================

const Dashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const [dashRes, rvRes] = await Promise.all([
          axiosClient.get("/user/dashboard"),
          axiosClient.get("/user/recentlyViewed").catch(() => ({ data: { recentlyViewed: [] } })),
        ]);
        if (!cancelled) {
          setData(dashRes.data);
          setRecentlyViewed(rvRes.data.recentlyViewed || []);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)] animate-spin" />
          <span className="text-xs text-[var(--text-tertiary)]">Loading workspace…</span>
        </div>
      </div>
    );
  }
  if (!data) return null;

  const { dailyChallenge, recentSubmissions, recommendedProblems, stats, activityGraph, upcomingContests } = data;
  const firstName = user?.firstName || "Developer";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const totalSubmissions90d = activityGraph.reduce((s, d) => s + d.submissions, 0);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[var(--bg-base)]">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8 space-y-6">

        {/* ================================================================
            SECTION 1 — HERO & COMMAND BAR
            ================================================================ */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden glass-card p-6 lg:p-7 border border-[var(--border-default)] rounded-2xl"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--accent-glow)] rounded-full blur-3xl opacity-30 pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  {greeting}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                <span className="text-xs text-[var(--text-secondary)]">XCODE Workspace</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                Welcome back, <span className="gradient-text-blue">{firstName}</span>
              </h1>
              <p className="text-xs lg:text-[13px] text-[var(--text-secondary)] max-w-xl leading-relaxed">
                {stats.streak > 0 ? (
                  <>You are on a <span className="text-[var(--orange)] font-semibold">{stats.streak}-day streak</span>! Solve a problem today to keep your momentum going.</>
                ) : (
                  <>Sharpen your algorithmic skills today. Start by completing today's daily challenge.</>
                )}
              </p>
            </div>

            {/* Quick Primary Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {dailyChallenge && (
                <button
                  onClick={() => navigate(`/problem/${dailyChallenge._id}`)}
                  className="btn-primary !py-2.5 !px-4 text-xs font-medium flex items-center gap-2 shadow-lg shadow-blue-500/10"
                >
                  <Sparkles size={14} /> Solve Daily Challenge
                </button>
              )}
              <button
                onClick={() => navigate("/problems")}
                className="btn-secondary !py-2.5 !px-4 text-xs font-medium flex items-center gap-2"
              >
                <Code2 size={14} /> Browse Catalog
              </button>
            </div>
          </div>

          {/* Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[var(--border-subtle)]">
            <MetricTile
              icon={Flame}
              label="Solving Streak"
              value={`${stats.streak} Days`}
              color="text-[var(--orange)]"
              badge={stats.streak > 0 ? "Active" : "Ready"}
            />
            <MetricTile
              icon={Trophy}
              label="Problems Solved"
              value={stats.totalSolved}
              color="text-[var(--accent)]"
              badge={`Acc. ${stats.acceptanceRate}%`}
            />
            <MetricTile
              icon={TrendingUp}
              label="Total Submissions"
              value={stats.totalSubmissions}
              color="text-[var(--purple)]"
              badge={`${stats.acceptedSubmissions} passed`}
            />
            <MetricTile
              icon={Target}
              label="Global Standing"
              value={`#${Math.max(1, 1000 - stats.totalSolved * 10)}`}
              color="text-[var(--success)]"
              badge="Top 15%"
            />
          </div>
        </motion.section>

        {/* ================================================================
            FEATURED UPCOMING CONTEST TICKER
            ================================================================ */}
        {upcomingContests?.[0] && (
          <div className="surface p-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[var(--bg-surface)] to-[var(--bg-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Trophy size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    {upcomingContests[0].title}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-medium">
                    {upcomingContests[0].badge || "Rated"}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                  Starts {new Date(upcomingContests[0].startTime).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {upcomingContests[0].durationMinutes} mins · {upcomingContests[0].registeredCount.toLocaleString()} registered
                </div>
              </div>
            </div>
            <NavLink
              to="/contests"
              className="btn-secondary !text-xs !py-1.5 !px-3 self-start sm:self-auto flex items-center gap-1.5 border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
            >
              View Contests <ArrowRight size={12} />
            </NavLink>
          </div>
        )}

        {/* ================================================================
            SECTION 2 — DAILY CHALLENGE & IN PROGRESS (2 Columns)
            ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Daily Challenge (1/3 Col) */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold flex items-center gap-1.5">
                <Sparkles size={13} className="text-[var(--warning)]" />
                Featured Challenge
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">24h Refresh</span>
            </div>
            {dailyChallenge ? (
              <div className="glass-card p-5 border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-[var(--bg-surface)] to-[var(--bg-surface)] rounded-xl flex flex-col justify-between h-[calc(100%-1.75rem)] hover:border-amber-500/40 transition-all group">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`pill ${
                      dailyChallenge.difficulty === "easy" ? "badge-difficulty-easy"
                        : dailyChallenge.difficulty === "medium" ? "badge-difficulty-medium"
                        : "badge-difficulty-hard"
                    }`}>
                      {dailyChallenge.difficulty}
                    </span>
                    <span className="text-[11px] text-[var(--text-tertiary)] font-mono flex items-center gap-1">
                      <Clock size={11} /> ~20 min
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2 mb-2">
                    {dailyChallenge.title}
                  </h3>
                  <div className="flex flex-wrap gap-1 mb-4">
                    <span className="pill text-[10px] !py-0.5">{dailyChallenge.tags}</span>
                  </div>
                </div>
                <NavLink
                  to={`/problem/${dailyChallenge._id}`}
                  className="btn-primary !py-2 text-xs w-full flex items-center justify-center gap-1.5 mt-2"
                >
                  Solve Challenge <ArrowRight size={13} />
                </NavLink>
              </div>
            ) : (
              <div className="glass-card p-6 text-center text-xs text-[var(--text-tertiary)] rounded-xl">
                No active daily challenge available.
              </div>
            )}
          </div>

          {/* Continue Learning / Recently Solved (2/3 Col) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold flex items-center gap-1.5">
                <Clock size={13} className="text-[var(--accent)]" />
                Continue Learning
              </span>
              <NavLink to="/problems" className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
                View All <ChevronRight size={12} />
              </NavLink>
            </div>
            <div className="glass-card rounded-xl p-2 border border-[var(--border-default)]">
              {recentlyViewed.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <Code2 size={24} className="text-[var(--text-muted)] mx-auto mb-2" />
                  <p className="text-xs text-[var(--text-secondary)]">No recently viewed problems yet.</p>
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-1 mb-3">Jump into the catalog to start practicing.</p>
                  <button onClick={() => navigate("/problems")} className="btn-secondary !text-xs !py-1.5">
                    Start Solving
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {recentlyViewed.slice(0, 4).map((p) => (
                    <NavLink
                      key={p._id}
                      to={`/problem/${p._id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] flex-shrink-0 group-hover:border-[var(--accent)] group-hover:text-[var(--accent)] transition-colors">
                          <Code2 size={13} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
                            {p.title}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-medium ${
                              p.difficulty === "easy" ? "text-[var(--success)]"
                                : p.difficulty === "medium" ? "text-[var(--warning)]"
                                : "text-[var(--danger)]"
                            }`}>
                              {p.difficulty}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)]">·</span>
                            <span className="text-[10px] text-[var(--text-tertiary)] truncate">{p.tags}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)] flex-shrink-0">
                        {p.viewedAt && <span>{formatRelative(p.viewedAt)}</span>}
                        <ArrowRight size={13} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                      </div>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================
            SECTION 3 — SOLVING PROGRESS & ACTIVITY HEATMAP (2 Columns)
            ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Solved Breakdown (2/5 Col) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold flex items-center gap-1.5">
                <Target size={13} className="text-[var(--success)]" />
                Problem Breakdown
              </span>
              <span className="text-xs text-[var(--text-secondary)] font-mono font-medium">
                {stats.totalSolved} Solved
              </span>
            </div>
            <div className="glass-card p-5 rounded-xl border border-[var(--border-default)] space-y-4">
              {/* Stacked Progress Bar */}
              <div className="h-2 w-full rounded-full bg-[var(--bg-elevated)] overflow-hidden flex">
                <div
                  className="bg-[var(--success)] h-full transition-all duration-500"
                  style={{ width: `${stats.totalSolved > 0 ? (stats.easy / stats.totalSolved) * 100 : 0}%` }}
                  title={`Easy: ${stats.easy}`}
                />
                <div
                  className="bg-[var(--warning)] h-full transition-all duration-500"
                  style={{ width: `${stats.totalSolved > 0 ? (stats.medium / stats.totalSolved) * 100 : 0}%` }}
                  title={`Medium: ${stats.medium}`}
                />
                <div
                  className="bg-[var(--danger)] h-full transition-all duration-500"
                  style={{ width: `${stats.totalSolved > 0 ? (stats.hard / stats.totalSolved) * 100 : 0}%` }}
                  title={`Hard: ${stats.hard}`}
                />
              </div>

              {/* Breakdown Tiles */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-2.5 rounded-lg bg-[var(--success-soft)] border border-[var(--success)]/20 text-center">
                  <span className="text-[10px] text-[var(--success)] font-medium uppercase tracking-wider">Easy</span>
                  <div className="text-lg font-bold text-[var(--text-primary)] mt-0.5">{stats.easy}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--warning-soft)] border border-[var(--warning)]/20 text-center">
                  <span className="text-[10px] text-[var(--warning)] font-medium uppercase tracking-wider">Med</span>
                  <div className="text-lg font-bold text-[var(--text-primary)] mt-0.5">{stats.medium}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--danger-soft)] border border-[var(--danger)]/20 text-center">
                  <span className="text-[10px] text-[var(--danger)] font-medium uppercase tracking-wider">Hard</span>
                  <div className="text-lg font-bold text-[var(--text-primary)] mt-0.5">{stats.hard}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] pt-2 border-t border-[var(--border-subtle)]">
                <span>Acceptance Ratio</span>
                <span className="font-mono text-[var(--text-primary)] font-medium">{stats.acceptanceRate}%</span>
              </div>
            </div>
          </div>

          {/* Activity Heatmap (3/5 Col) */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold flex items-center gap-1.5">
                <Activity size={13} className="text-[var(--purple)]" />
                Submission Activity
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">
                {totalSubmissions90d} submissions in 90 days
              </span>
            </div>
            <div className="glass-card p-5 rounded-xl border border-[var(--border-default)]">
              <ActivityGraph data={activityGraph} days={90} />
            </div>
          </div>
        </div>

        {/* ================================================================
            SECTION 4 — RECOMMENDED & RECENT SUBMISSIONS (2 Columns)
            ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Curated Recommendations */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold flex items-center gap-1.5">
                <Code2 size={13} className="text-[var(--accent)]" />
                Recommended Challenges
              </span>
              <NavLink to="/problems" className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
                Browse All <ChevronRight size={12} />
              </NavLink>
            </div>
            <div className="glass-card p-2 rounded-xl border border-[var(--border-default)] divide-y divide-[var(--border-subtle)]">
              {recommendedProblems.length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--text-tertiary)]">
                  Solve a few problems to receive personalized suggestions.
                </div>
              ) : (
                recommendedProblems.slice(0, 4).map((p) => (
                  <NavLink
                    key={p._id}
                    to={`/problem/${p._id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors group"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="text-xs font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
                        {p.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`pill text-[10px] !py-0.5 ${
                          p.difficulty === "easy" ? "badge-difficulty-easy"
                            : p.difficulty === "medium" ? "badge-difficulty-medium"
                            : "badge-difficulty-hard"
                        }`}>
                          {p.difficulty}
                        </span>
                        <span className="text-[10px] text-[var(--text-tertiary)]">{p.tags}</span>
                      </div>
                    </div>
                    <span className="btn-secondary !text-[11px] !py-1 !px-2.5 flex items-center gap-1 flex-shrink-0 group-hover:border-[var(--accent)] transition-colors">
                      Solve <ArrowRight size={11} />
                    </span>
                  </NavLink>
                ))
              )}
            </div>
          </div>

          {/* Recent Submissions Feed */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold flex items-center gap-1.5">
                <Clock size={13} className="text-[var(--text-tertiary)]" />
                Recent Submissions
              </span>
              <NavLink to="/profile" className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                History
              </NavLink>
            </div>
            <div className="glass-card p-2 rounded-xl border border-[var(--border-default)] divide-y divide-[var(--border-subtle)]">
              {recentSubmissions.length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--text-tertiary)]">
                  No submissions recorded yet.
                </div>
              ) : (
                recentSubmissions.slice(0, 4).map((s) => (
                  <NavLink
                    key={s._id}
                    to={s.problemId ? `/problem/${s.problemId}` : "/problems"}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {s.status === "accepted" ? (
                        <CheckCircle2 size={15} className="text-[var(--success)] flex-shrink-0" />
                      ) : (
                        <XCircle size={15} className="text-[var(--danger)] flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
                          {s.problemTitle || "Problem"}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5">
                          <span>{s.language}</span>
                          {s.runtime && <span>· {s.runtime}s</span>}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">
                      {formatRelative(s.createdAt)}
                    </span>
                  </NavLink>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// --- Sub-components ---
const MetricTile = ({ icon: Icon, label, value, color, badge }) => (
  <div className="surface p-3.5 rounded-xl border border-[var(--border-subtle)]">
    <div className="flex items-center justify-between mb-1">
      <span className="text-[11px] text-[var(--text-tertiary)] font-medium">{label}</span>
      <Icon size={14} className={color} />
    </div>
    <div className="flex items-baseline justify-between mt-1">
      <span className="text-xl font-bold text-[var(--text-primary)]">{value}</span>
      {badge && (
        <span className="text-[10px] font-medium text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
          {badge}
        </span>
      )}
    </div>
  </div>
);

const formatRelative = (isoDate) => {
  const d = new Date(isoDate);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
};

export default Dashboard;