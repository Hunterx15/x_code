import { NavLink, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../authSlice";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axiosClient from "../utils/axiosClient";
import {
  LayoutDashboard,
  Code2,
  Trophy,
  MessageSquare,
  Sparkles,
  StickyNote,
  User,
  Search,
  Bell,
  LogOut,
  Settings,
  ChevronDown,
  Shuffle,
  CornerDownLeft,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// XCODE Navbar — persistent, sticky, inspired by GitHub + LeetCode.
// Left: logo + primary nav. Right: spotlight search + user menu.
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/problems", label: "Problems", icon: Code2 },
  { to: "/contests", label: "Contests", icon: Sparkles },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/notes", label: "Notes", icon: StickyNote },
];

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [problems, setProblems] = useState([]);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Fetch problems when search is opened
  useEffect(() => {
    if (searchOpen && problems.length === 0) {
      axiosClient
        .get("/problem/getAllProblem")
        .then((res) => setProblems(res.data || []))
        .catch(() => {});
    }
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [searchOpen, problems.length]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
    setMenuOpen(false);
    navigate("/login");
  };

  const filteredProblems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return problems
      .filter((p) => p.title.toLowerCase().includes(q) || p.tags?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [searchQuery, problems]);

  const handlePickRandom = () => {
    if (problems.length === 0) return;
    const random = problems[Math.floor(Math.random() * problems.length)];
    setSearchOpen(false);
    navigate(`/problem/${random._id}`);
  };

  const initials = (user?.firstName || "?").charAt(0).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-40 h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/80 backdrop-blur-xl">
        <div className="flex h-full items-center justify-between px-4 lg:px-6">
          {/* Left: logo + nav */}
          <div className="flex items-center gap-1">
            {/* Logo */}
            <NavLink to="/dashboard" className="flex items-center gap-2 px-2 mr-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
                <Code2 size={16} className="text-white" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)] hidden sm:block">
                XCODE
              </span>
            </NavLink>

            {/* Primary nav */}
            <nav className="flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                        isActive
                          ? "text-[var(--text-primary)] bg-[var(--bg-surface)]"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                      }`
                    }
                  >
                    <Icon size={14} />
                    <span className="hidden md:block">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Right: search + notifications + user */}
          <div className="flex items-center gap-2">
            {/* Command-K search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-default)] text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
              aria-label="Open Command Search"
            >
              <Search size={14} />
              <span className="hidden sm:inline text-zinc-500">Search problems...</span>
              <kbd className="hidden sm:inline text-[10px] bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded text-zinc-400 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-1.5 py-1 rounded-md hover:bg-[var(--bg-surface)] transition-colors"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.firstName}
                    referrerPolicy="no-referrer"
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[11px] font-semibold text-white">
                    {initials}
                  </div>
                )}
                <ChevronDown size={12} className="text-[var(--text-tertiary)] hidden sm:block" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-2 w-56 surface-elevated rounded-lg overflow-hidden shadow-lg border border-[var(--border-default)]"
                  >
                    {/* User info header */}
                    <div className="px-3 py-2.5 border-b border-[var(--border-subtle)]">
                      <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                        {user?.firstName} {user?.lastName || ""}
                      </div>
                      <div className="text-[11px] text-[var(--text-tertiary)] truncate">
                        {user?.emailId}
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <NavLink
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                      >
                        <User size={14} />
                        My Profile
                      </NavLink>
                      {user?.role === "admin" && (
                        <NavLink
                          to="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                        >
                          <Settings size={14} />
                          Admin Panel
                        </NavLink>
                      )}
                    </div>

                    <div className="py-1 border-t border-[var(--border-subtle)]">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Spotlight Command Palette Modal */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-xl surface-elevated rounded-xl border border-[var(--border-default)] shadow-2xl overflow-hidden"
            >
              {/* Search input header */}
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border-subtle)]">
                <Search size={16} className="text-zinc-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type a problem name or tag..."
                  className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-300"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Search results or Quick Actions */}
              <div className="max-h-80 overflow-y-auto p-2">
                {searchQuery.trim() ? (
                  <div>
                    <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 py-1.5">
                      Problems ({filteredProblems.length})
                    </div>
                    {filteredProblems.length === 0 ? (
                      <p className="text-xs text-zinc-500 px-3 py-4 text-center">
                        No problems found matching "{searchQuery}"
                      </p>
                    ) : (
                      filteredProblems.map((p) => (
                        <button
                          key={p._id}
                          onClick={() => {
                            setSearchOpen(false);
                            navigate(`/problem/${p._id}`);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-[var(--bg-surface-hover)] transition-colors group"
                        >
                          <div className="flex items-center gap-2.5">
                            <Code2 size={14} className="text-zinc-400 group-hover:text-[var(--accent)]" />
                            <span className="text-[13px] text-zinc-200 group-hover:text-white">
                              {p.title}
                            </span>
                            <span className="text-[11px] text-zinc-500">#{p.tags}</span>
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                              p.difficulty === "easy"
                                ? "text-emerald-400 bg-emerald-950/40"
                                : p.difficulty === "medium"
                                ? "text-yellow-400 bg-yellow-950/40"
                                : "text-rose-400 bg-rose-950/40"
                            }`}
                          >
                            {p.difficulty}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 py-1">
                        Quick Navigation
                      </div>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        {NAV_ITEMS.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.to}
                              onClick={() => {
                                setSearchOpen(false);
                                navigate(item.to);
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs text-zinc-300 hover:text-white hover:bg-[var(--bg-surface-hover)] transition-colors"
                            >
                              <Icon size={13} className="text-zinc-400" />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-subtle)]">
                      <button
                        onClick={handlePickRandom}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-purple-300 hover:text-purple-200 hover:bg-purple-950/30 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Shuffle size={13} />
                          <span>Pick a Random Problem</span>
                        </div>
                        <CornerDownLeft size={12} className="text-zinc-600" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-between text-[11px] text-zinc-500">
                <span>Navigation & search</span>
                <span className="font-mono">ESC to close</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
