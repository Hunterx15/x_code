import { useEffect, useState, useCallback } from "react";
import { NavLink } from "react-router";
import { motion } from "framer-motion";
import {
  Trophy,
  Medal,
  Crown,
  ChevronRight,
  ChevronLeft,
  Loader2,
  XCircle,
} from "lucide-react";
import axiosClient from "../utils/axiosClient";

// ===========================================================================
// XCODE Leaderboard — global rankings.
// Now rendered inside AppLayout (no internal nav needed).
// ===========================================================================

const Leaderboard = () => {
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPage = useCallback(async (page) => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get(`/user/leaderboard?page=${page}&limit=${pagination.limit}`);
      setEntries(data.leaderboard);
      setPagination(data.pagination);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-6 w-6 rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <XCircle size={28} className="text-[var(--danger)] mx-auto mb-2" />
          <p className="text-[13px] text-[var(--text-secondary)]">{error}</p>
        </div>
      </div>
    );
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown size={16} className="text-yellow-400" />;
    if (rank === 2) return <Medal size={16} className="text-zinc-300" />;
    if (rank === 3) return <Medal size={16} className="text-amber-600" />;
    return <span className="text-[12px] text-[var(--text-tertiary)] font-mono">{rank}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 flex items-center gap-2"
      >
        <Trophy size={20} className="text-[var(--warning)]" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-[12px] text-[var(--text-tertiary)]">
            Ranked by total problems solved · {pagination.total} users
          </p>
        </div>
      </motion.div>

      {/* Podium for top 3 (only on page 1) */}
      {pagination.page === 1 && entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[1, 0, 2].map((idx) => {
            const e = entries[idx];
            if (!e) return <div key={idx} />;
            const isFirst = e.rank === 1;
            return (
              <motion.div
                key={e._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className={`surface rounded-xl p-4 text-center ${
                  isFirst ? "border-yellow-600/40 bg-gradient-to-br from-yellow-950/20 to-[var(--bg-surface)] order-2 -mt-3"
                  : e.rank === 2 ? "border-zinc-500/30 order-1"
                  : "border-amber-700/30 bg-gradient-to-br from-amber-950/15 to-[var(--bg-surface)] order-3"
                }`}
              >
                <div className="flex justify-center mb-2">
                  {isFirst ? <Crown size={26} className="text-yellow-400" />
                    : e.rank === 2 ? <Medal size={22} className="text-zinc-300" />
                    : <Medal size={22} className="text-amber-600" />}
                </div>
                <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                  {e.firstName} {e.lastName || ""}
                </div>
                <div className="text-xl font-bold text-[var(--text-primary)] mt-1">{e.totalSolved}</div>
                <div className="text-[10px] text-[var(--text-tertiary)]">solved</div>
                {e.badgeCount > 0 && (
                  <div className="text-[10px] text-[var(--warning)] mt-1 flex items-center justify-center gap-1">
                    <Trophy size={9} /> {e.badgeCount} badges
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Rankings table */}
      <div className="surface rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="text-left text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium px-4 py-3 w-16">Rank</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium px-4 py-3">User</th>
              <th className="text-right text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium px-4 py-3">Solved</th>
              <th className="text-right text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium px-4 py-3 hidden sm:table-cell">Badges</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e._id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-surface-hover)] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">{getRankIcon(e.rank)}</div>
                </td>
                <td className="px-4 py-3">
                  <NavLink to="/profile" className="flex items-center gap-2.5">
                    {e.avatarUrl ? (
                      <img src={e.avatarUrl} alt={e.firstName} referrerPolicy="no-referrer" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-semibold text-white">
                        {e.firstName?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <span className="text-[13px] text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">
                      {e.firstName} {e.lastName || ""}
                    </span>
                  </NavLink>
                </td>
                <td className="px-4 py-3 text-right font-mono text-[13px] text-[var(--text-primary)]">{e.totalSolved}</td>
                <td className="px-4 py-3 text-right hidden sm:table-cell">
                  {e.badgeCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[12px] text-[var(--warning)]">
                      <Trophy size={11} /> {e.badgeCount}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => fetchPage(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
            className="btn-secondary"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-[12px] text-[var(--text-tertiary)]">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || loading}
            className="btn-secondary"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
