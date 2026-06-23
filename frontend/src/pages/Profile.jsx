import { useEffect, useState, useCallback } from "react";
import { NavLink } from "react-router";
import { motion } from "framer-motion";
import axiosClient from "../utils/axiosClient";
import ActivityGraph from "../components/ActivityGraph";
import {
  Trophy,
  Flame,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  Code2,
  Bookmark,
  Heart,
  History,
  Target,
  Award,
  Crown,
  Medal,
} from "lucide-react";
import { useSelector } from "react-redux";

// ===========================================================================
// XCODE Profile — GitHub-inspired.
// Uses GET /user/profile + /user/achievements + /user/bookmarks + /user/favorites + /user/recentlyViewed.
// ===========================================================================

const Profile = () => {
  const { user: currentUser } = useSelector((s) => s.auth);
  const [profile, setProfile] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [achievements, setAchievements] = useState({ earned: [], available: [], stats: null });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [profileRes, bookmarksRes, favoritesRes, recentRes, achievementsRes] = await Promise.all([
          axiosClient.get("/user/profile"),
          axiosClient.get("/user/bookmarks").catch(() => ({ data: { bookmarks: [] } })),
          axiosClient.get("/user/favorites").catch(() => ({ data: { favorites: [] } })),
          axiosClient.get("/user/recentlyViewed").catch(() => ({ data: { recentlyViewed: [] } })),
          axiosClient.get("/user/achievements").catch(() => ({ data: { earned: [], available: [], stats: null } })),
        ]);
        setProfile(profileRes.data);
        setBookmarks(bookmarksRes.data.bookmarks || []);
        setFavorites(favoritesRes.data.favorites || []);
        setRecentlyViewed(recentRes.data.recentlyViewed || []);
        setAchievements(achievementsRes.data || { earned: [], available: [], stats: null });
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err?.response?.data?.error || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const fetchSubmissions = useCallback(async (page) => {
    try {
      setSubmissionsLoading(true);
      const { data } = await axiosClient.get(
        `/user/submissions?page=${page}&limit=${pagination.limit}`
      );
      setSubmissions(data.submissions);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Submissions fetch error:", err);
    } finally {
      setSubmissionsLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    fetchSubmissions(1);
  }, [fetchSubmissions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-6 w-6 rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }
  if (error) return <div className="text-center py-20 text-[var(--danger)]">{error}</div>;
  if (!profile) return null;

  const { user, stats, activityGraph, recentSubmissions } = profile;
  const initials = (user.firstName || "?").charAt(0).toUpperCase();
  const totalSolved = stats.totalSolved || 0;
  const pct = (n) => (totalSolved > 0 ? Math.round((n / totalSolved) * 100) : 0);

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8 space-y-6">
      {/* ============ HERO ============ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="surface rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.firstName}
            referrerPolicy="no-referrer"
            className="w-20 h-20 rounded-full object-cover border-2 border-[var(--border-default)]"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">
            {user.firstName} {user.lastName || ""}
          </h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mb-3">{user.emailId}</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="pill">
              <Trophy size={11} className="text-[var(--accent)]" /> {stats.totalSolved} solved
            </span>
            <span className="pill">
              <Flame size={11} className="text-[var(--orange)]" /> {stats.streak} day streak
            </span>
            <span className="pill">
              <TrendingUp size={11} className="text-[var(--purple)]" /> {stats.acceptanceRate}% acceptance
            </span>
            {user.role === "admin" && <span className="pill badge-difficulty-medium">admin</span>}
          </div>
        </div>
      </motion.div>

      {/* ============ STAT CARDS ============ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={Trophy} label="Total" value={stats.totalSolved} color="text-[var(--accent)]" />
        <StatCard icon={CheckCircle2} label="Easy" value={stats.easy} color="text-[var(--success)]" sub={`${pct(stats.easy)}%`} />
        <StatCard icon={CheckCircle2} label="Medium" value={stats.medium} color="text-[var(--warning)]" sub={`${pct(stats.medium)}%`} />
        <StatCard icon={CheckCircle2} label="Hard" value={stats.hard} color="text-[var(--danger)]" sub={`${pct(stats.hard)}%`} />
        <StatCard icon={TrendingUp} label="Acceptance" value={`${stats.acceptanceRate}%`} color="text-[var(--purple)]" sub={`${stats.acceptedSubmissions}/${stats.totalSubmissions}`} />
      </div>

      {/* ============ DIFFICULTY BREAKDOWN ============ */}
      <div className="surface rounded-xl p-5">
        <h3 className="text-[14px] font-semibold mb-4 flex items-center gap-2">
          <Target size={15} className="text-[var(--success)]" />
          Solved by Difficulty
        </h3>
        <div className="space-y-3">
          <DifficultyBar label="Easy" count={stats.easy} total={totalSolved} color="bg-[var(--success)]" />
          <DifficultyBar label="Medium" count={stats.medium} total={totalSolved} color="bg-[var(--warning)]" />
          <DifficultyBar label="Hard" count={stats.hard} total={totalSolved} color="bg-[var(--danger)]" />
        </div>
      </div>

      {/* ============ ACTIVITY HEATMAP ============ */}
      <div className="surface rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold flex items-center gap-2">
            <TrendingUp size={15} className="text-[var(--accent)]" />
            Activity (90 days)
          </h3>
          <span className="text-[11px] text-[var(--text-tertiary)]">
            {activityGraph.reduce((sum, d) => sum + d.submissions, 0)} submissions
          </span>
        </div>
        <ActivityGraph data={activityGraph} days={90} />
      </div>

      {/* ============ ACHIEVEMENTS ============ */}
      {achievements.earned.length > 0 && (
        <div className="surface rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold flex items-center gap-2">
              <Award size={15} className="text-[var(--warning)]" />
              Achievements
            </h3>
            <span className="text-[11px] text-[var(--text-tertiary)]">
              {achievements.earned.length} earned
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {achievements.earned.map((b) => (
              <div
                key={b.id}
                className={`p-3 rounded-lg border bg-gradient-to-br to-[var(--bg-surface)] ${
                  b.tier === "gold" ? "from-yellow-950/30 border-yellow-700/40 text-yellow-400"
                    : b.tier === "silver" ? "from-zinc-700/30 border-zinc-500/40 text-zinc-300"
                    : b.tier === "platinum" ? "from-cyan-950/30 border-cyan-600/40 text-cyan-400"
                    : "from-amber-950/30 border-amber-700/40 text-amber-400"
                }`}
                title={b.description}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Trophy size={12} />
                  <span className="text-[12px] font-medium text-[var(--text-primary)] truncate">{b.name}</span>
                </div>
                <p className="text-[10px] text-[var(--text-tertiary)] line-clamp-2">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ ENGAGEMENT: bookmarks + favorites + recently viewed ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <EngagementCard icon={Bookmark} title="Bookmarks" items={bookmarks} accent="text-[var(--warning)]" />
        <EngagementCard icon={Heart} title="Favorites" items={favorites} accent="text-[var(--danger)]" />
        <EngagementCard icon={History} title="Recently Viewed" items={recentlyViewed} accent="text-[var(--accent)]" />
      </div>

      {/* ============ RECENT SUBMISSIONS ============ */}
      <div className="surface rounded-xl p-5">
        <h3 className="text-[14px] font-semibold mb-4 flex items-center gap-2">
          <Code2 size={15} className="text-[var(--text-secondary)]" />
          Recent Activity
        </h3>
        {recentSubmissions.length === 0 ? (
          <p className="text-[13px] text-[var(--text-tertiary)]">No submissions yet.</p>
        ) : (
          <div className="space-y-1.5">
            {recentSubmissions.map((s) => (
              <NavLink
                key={s._id}
                to={`/problem/${s.problemId}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <StatusBadge status={s.status} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-[var(--text-primary)] truncate">{s.problemTitle}</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                    <span className="font-mono">{s.language}</span>
                    <span>·</span>
                    <span className={s.difficulty === "easy" ? "text-[var(--success)]" : s.difficulty === "medium" ? "text-[var(--warning)]" : "text-[var(--danger)]"}>
                      {s.difficulty}
                    </span>
                    <span>·</span>
                    <span>{formatRelative(s.createdAt)}</span>
                  </div>
                </div>
                {s.status === "accepted" && (
                  <div className="flex items-center gap-3 text-[10px] text-[var(--text-tertiary)] font-mono">
                    <span>{s.runtime}s</span>
                    <span>{formatMemory(s.memory)}</span>
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-components ---
const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="surface rounded-lg p-3.5">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">{label}</span>
      <Icon size={13} className={color} />
    </div>
    <div className={`text-xl font-bold ${color}`}>{value}</div>
    {sub && <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{sub}</div>}
  </div>
);

const DifficultyBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-[12px] mb-1">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="text-[var(--text-tertiary)]">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
};

const EngagementCard = ({ icon: Icon, title, items, accent }) => (
  <div className="surface rounded-xl p-4">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-1.5">
        <Icon size={14} className={accent} />
        <h4 className="text-[13px] font-semibold">{title}</h4>
      </div>
      <span className="text-[11px] text-[var(--text-tertiary)]">{items.length}</span>
    </div>
    {items.length === 0 ? (
      <p className="text-[11px] text-[var(--text-tertiary)]">None yet.</p>
    ) : (
      <div className="space-y-1">
        {items.slice(0, 5).map((p) => (
          <NavLink
            key={p._id}
            to={`/problem/${p._id}`}
            className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-[var(--text-primary)] truncate">{p.title}</div>
              <div className={`text-[10px] ${p.difficulty === "easy" ? "text-[var(--success)]" : p.difficulty === "medium" ? "text-[var(--warning)]" : "text-[var(--danger)]"}`}>
                {p.difficulty}
              </div>
            </div>
            <ChevronRight size={12} className="text-[var(--text-muted)]" />
          </NavLink>
        ))}
        {items.length > 5 && <p className="text-[10px] text-[var(--text-muted)] pt-1">+{items.length - 5} more</p>}
      </div>
    )}
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    accepted: "text-[var(--success)] bg-[var(--success-soft)]",
    wrong: "text-[var(--danger)] bg-[var(--danger-soft)]",
    error: "text-[var(--warning)] bg-[var(--warning-soft)]",
    pending: "text-[var(--accent)] bg-[var(--accent-soft)]",
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
};

const formatMemory = (kb) => {
  if (kb == null || isNaN(kb)) return "—";
  if (kb < 1024) return `${kb} kB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

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

export default Profile;
