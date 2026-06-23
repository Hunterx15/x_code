import { NavLink, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../authSlice";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";

// ---------------------------------------------------------------------------
// XCODE Navbar — persistent, sticky, inspired by GitHub + LeetCode.
// Left: logo + primary nav. Right: search + notifications + user menu.
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/problems", label: "Problems", icon: Code2 },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/notes", label: "Notes", icon: StickyNote },
];

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuRef = useRef(null);

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

  const initials = (user?.firstName || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left: logo + nav */}
        <div className="flex items-center gap-1">
          {/* Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-2 px-2 mr-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-purple-600">
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
          {/* Search (decorative — expandable input) */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="btn-icon"
            aria-label="Search"
          >
            <Search size={16} />
          </button>

          {/* Notifications (decorative) */}
          <button className="btn-icon relative" aria-label="Notifications">
            <Bell size={16} />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
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
                  className="absolute right-0 top-full mt-2 w-56 surface-elevated rounded-lg overflow-hidden shadow-lg"
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
                      Profile
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

      {/* Search overlay (decorative) */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
          >
            <div className="px-4 py-3">
              <input
                autoFocus
                type="text"
                placeholder="Search problems, discussions, notes..."
                className="input-field"
                onBlur={() => setSearchOpen(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
