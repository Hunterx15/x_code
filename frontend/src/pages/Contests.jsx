import { useState, useEffect } from "react";
import { NavLink } from "react-router";
import { motion } from "framer-motion";
import axiosClient from "../utils/axiosClient";
import {
  Trophy,
  Calendar,
  Clock,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Timer,
  Zap,
  Flame,
  ShieldAlert,
} from "lucide-react";

// ===========================================================================
// XCODE Contests Hub — Live, Upcoming, and Past Competitions
// ===========================================================================

const Contests = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeredMap, setRegisteredMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("xcode:registered_contests")) || {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    let cancelled = false;
    const fetchContests = async () => {
      try {
        const { data } = await axiosClient.get("/user/dashboard");
        if (!cancelled) {
          setContests(data.upcomingContests || []);
        }
      } catch (err) {
        console.error("Contests fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchContests();
    return () => { cancelled = true; };
  }, []);

  const toggleRegister = (id) => {
    setRegisteredMap((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("xcode:registered_contests", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const nextContest = contests[0] || null;
  const remainingContests = contests.slice(1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-6 w-6 rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8 space-y-8">

      {/* ================================================================
          HEADER
          ================================================================ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="pill text-[10px] !py-0.5 bg-amber-500/10 text-amber-400 border-amber-500/30">
              <Sparkles size={11} className="inline mr-1" />
              Rated Competitions
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Coding Contests</h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Compete in real-time algorithmic tournaments and climb the global leaderboards.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] surface p-3 rounded-xl border border-[var(--border-default)]">
          <div className="text-center px-2">
            <div className="text-base font-bold text-amber-400">90m</div>
            <div className="text-[10px] text-[var(--text-tertiary)]">Duration</div>
          </div>
          <div className="h-6 w-px bg-[var(--border-subtle)]" />
          <div className="text-center px-2">
            <div className="text-base font-bold text-[var(--accent)]">4</div>
            <div className="text-[10px] text-[var(--text-tertiary)]">Problems</div>
          </div>
          <div className="h-6 w-px bg-[var(--border-subtle)]" />
          <div className="text-center px-2">
            <div className="text-base font-bold text-[var(--success)]">Rated</div>
            <div className="text-[10px] text-[var(--text-tertiary)]">Div 1 & 2</div>
          </div>
        </div>
      </div>

      {/* ================================================================
          FEATURED NEXT CONTEST (HERO CARD)
          ================================================================ */}
      {nextContest && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden glass-card p-6 lg:p-8 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-[var(--bg-surface)] to-[var(--bg-surface)] shadow-xl shadow-amber-500/5"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-400 text-black font-semibold uppercase tracking-wider">
                  Next Up
                </span>
                <span className="text-xs text-amber-300 font-medium">Starts This Week</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                {nextContest.title}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] max-w-lg leading-relaxed">
                4 algorithmic challenges ranging from warm-up to advanced graph/dynamic programming.
                Compete against thousands of developers worldwide.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)] pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-amber-400" />
                  {new Date(nextContest.startTime).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })} at 10:00 UTC
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-[var(--accent)]" /> {nextContest.durationMinutes} Minutes
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={13} className="text-[var(--success)]" />
                  {(nextContest.registeredCount + (registeredMap[nextContest.id] ? 1 : 0)).toLocaleString()} Registered
                </span>
              </div>
            </div>

            {/* Registration Action */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => toggleRegister(nextContest.id)}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                  registeredMap[nextContest.id]
                    ? "bg-[var(--success-soft)] border border-[var(--success)] text-[var(--success)]"
                    : "btn-primary !py-3 !px-6 shadow-blue-500/20"
                }`}
              >
                {registeredMap[nextContest.id] ? (
                  <>
                    <CheckCircle2 size={16} /> Registered
                  </>
                ) : (
                  <>
                    <Zap size={16} /> Register for Free
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ================================================================
          UPCOMING CONTESTS SCHEDULE
          ================================================================ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Calendar size={18} className="text-[var(--accent)]" />
            Upcoming Tournaments
          </h2>
          <span className="text-xs text-[var(--text-tertiary)]">
            {contests.length} Scheduled
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {remainingContests.map((c) => {
            const isRegistered = !!registeredMap[c.id];
            return (
              <div
                key={c.id}
                className="surface p-5 rounded-xl border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="pill text-[10px] !py-0.5">
                      {c.badge || "Rated"}
                    </span>
                    <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
                      {c.durationMinutes} mins
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors mb-1.5">
                    {c.title}
                  </h3>
                  <p className="text-xs text-[var(--text-tertiary)] mb-4">
                    {c.difficulty || "1 Easy · 2 Medium · 1 Hard"}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Calendar size={12} className="text-[var(--text-tertiary)]" />
                    {new Date(c.startTime).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <button
                    onClick={() => toggleRegister(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isRegistered
                        ? "bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/30"
                        : "btn-secondary !text-xs !py-1 !px-3"
                    }`}
                  >
                    {isRegistered ? "✓ Registered" : "Register"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================
          CONTEST RULES & RATING GUIDELINES
          ================================================================ */}
      <div className="surface p-6 rounded-2xl border border-[var(--border-default)]">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Award size={16} className="text-amber-400" />
          Contest Rules & Ranking
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[var(--text-secondary)] leading-relaxed">
          <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <div className="font-semibold text-[var(--text-primary)] mb-1">Scoring & Penalties</div>
            Problems are weighted by difficulty (3, 4, 5, 6 pts). A 5-minute penalty is added for each failed submission on an eventually accepted problem.
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <div className="font-semibold text-[var(--text-primary)] mb-1">Plagiarism Checks</div>
            All submissions are analyzed by automated code similarity detectors. Collusion or generative AI pasting leads to disqualification.
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <div className="font-semibold text-[var(--text-primary)] mb-1">Rating Updates</div>
            Elo ratings are recalculated within 24 hours of contest completion. Achieve badges as you break past 1600, 1800, and 2100 rating thresholds.
          </div>
        </div>
      </div>

    </div>
  );
};

export default Contests;