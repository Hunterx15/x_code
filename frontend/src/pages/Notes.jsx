import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import { motion } from "framer-motion";
import { StickyNote, ChevronRight, FileCode2 } from "lucide-react";
import axiosClient from "../utils/axiosClient";
import { useSelector } from "react-redux";

// ===========================================================================
// XCODE Notes page — shows all problems the user has notes on.
// Since notes are per-problem, this page lists problems that have notes
// and links to the problem page's Notes tab.
//
// We fetch the user's recentlyViewed + bookmarks as a proxy for "problems
// the user is actively working on" since there's no "list all notes" endpoint.
// ===========================================================================

const Notes = () => {
  const { user } = useSelector((s) => s.auth);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rvRes, bmRes] = await Promise.all([
          axiosClient.get("/user/recentlyViewed").catch(() => ({ data: { recentlyViewed: [] } })),
          axiosClient.get("/user/bookmarks").catch(() => ({ data: { bookmarks: [] } })),
        ]);
        setRecentlyViewed(rvRes.data.recentlyViewed || []);
        setBookmarks(bmRes.data.bookmarks || []);
      } catch (err) {
        console.error("Notes page fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-6 w-6 rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }

  // Merge recently viewed + bookmarks, dedupe by _id
  const allProblems = [...recentlyViewed, ...bookmarks];
  const seen = new Set();
  const uniqueProblems = allProblems.filter((p) => {
    if (seen.has(p._id)) return false;
    seen.add(p._id);
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 flex items-center gap-2"
      >
        <StickyNote size={20} className="text-[var(--warning)]" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Notes</h1>
          <p className="text-[12px] text-[var(--text-tertiary)]">
            Your personal notes for problems you're working on
          </p>
        </div>
      </motion.div>

      {uniqueProblems.length === 0 ? (
        <div className="surface rounded-xl p-12 text-center">
          <StickyNote size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[14px] text-[var(--text-secondary)] mb-1">No notes yet</p>
          <p className="text-[12px] text-[var(--text-tertiary)] mb-4">
            Open a problem and switch to the Notes tab to start writing.
          </p>
          <NavLink to="/problems" className="btn-primary inline-flex">
            Browse Problems
          </NavLink>
        </div>
      ) : (
        <div className="surface rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
            <p className="text-[12px] text-[var(--text-tertiary)]">
              Problems you can add notes to:
            </p>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {uniqueProblems.map((p) => (
              <NavLink
                key={p._id}
                to={`/problem/${p._id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--bg-surface-hover)] transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileCode2 size={15} className="text-[var(--accent)] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
                      {p.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] ${
                        p.difficulty === "easy" ? "text-[var(--success)]"
                          : p.difficulty === "medium" ? "text-[var(--warning)]"
                          : "text-[var(--danger)]"
                      }`}>
                        {p.difficulty}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">·</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">{p.tags}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
