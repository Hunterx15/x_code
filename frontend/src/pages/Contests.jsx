import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
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
  Zap,
  Plus,
  Play,
  X,
  Radio,
  Loader2,
  Swords,
} from "lucide-react";

// ===========================================================================
// XCODE Contests Hub — Host Live Contests, Enter Active Arenas & Practice Virtual
// ===========================================================================

const formatCountdown = (targetIso) => {
  const diff = Math.max(0, new Date(targetIso).getTime() - Date.now());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const Contests = () => {
  const navigate = useNavigate();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState({});
  const [, setTick] = useState(0);

  // Host Contest modal state
  const [hostOpen, setHostOpen] = useState(false);
  const [hostTitle, setHostTitle] = useState("");
  const [hostDuration, setHostDuration] = useState(90);
  const [hostStartNow, setHostStartNow] = useState(true);
  const [hostStartTime, setHostStartTime] = useState("");
  const [hosting, setHosting] = useState(false);
  const [hostError, setHostError] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchContests = async () => {
    try {
      const { data } = await axiosClient.get("/contest/all");
      setContests(data.contests || []);
    } catch (err) {
      console.error("Contests fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  const toggleRegister = async (contestId, isCurrentlyRegistered) => {
    if (registering[contestId]) return;
    setRegistering((prev) => ({ ...prev, [contestId]: true }));

    setContests((prev) =>
      prev.map((c) =>
        c._id === contestId || c.id === contestId
          ? {
              ...c,
              isRegistered: !isCurrentlyRegistered,
              registeredCount: Math.max(
                0,
                (c.registeredCount || 0) + (isCurrentlyRegistered ? -1 : 1)
              ),
            }
          : c
      )
    );

    try {
      const endpoint = isCurrentlyRegistered
        ? `/contest/unregister/${contestId}`
        : `/contest/register/${contestId}`;
      const { data } = await axiosClient.post(endpoint);
      setContests((prev) =>
        prev.map((c) =>
          c._id === contestId || c.id === contestId
            ? {
                ...c,
                isRegistered: data.isRegistered,
                registeredCount: data.registeredCount,
              }
            : c
        )
      );
    } catch (err) {
      console.error("Contest registration error:", err);
      fetchContests();
    } finally {
      setRegistering((prev) => ({ ...prev, [contestId]: false }));
    }
  };

  const handleHostSubmit = async (e) => {
    e.preventDefault();
    if (!hostTitle.trim()) {
      setHostError("Please enter a contest title.");
      return;
    }
    if (!hostStartNow && !hostStartTime) {
      setHostError("Please choose a start date/time or select Start Now.");
      return;
    }
    setHosting(true);
    setHostError(null);
    try {
      const { data } = await axiosClient.post("/contest/host", {
        title: hostTitle.trim(),
        durationMinutes: Number(hostDuration),
        startNow: hostStartNow,
        startTime: hostStartNow ? undefined : new Date(hostStartTime).toISOString(),
      });
      setHostOpen(false);
      setHostTitle("");
      if (data?.contest?._id && hostStartNow) {
        navigate(`/contests/${data.contest._id}`);
      } else {
        await fetchContests();
      }
    } catch (err) {
      setHostError(err?.response?.data?.error || "Failed to host contest");
    } finally {
      setHosting(false);
    }
  };

  const liveContests = contests.filter((c) => c.status === "live");
  const upcomingContests = contests.filter((c) => c.status === "upcoming");
  const endedContests = contests.filter((c) => c.status === "ended");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-6 w-6 rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-grid-subtle">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8 space-y-8">
        {/* ================================================================
            HEADER + HOST CONTEST CTA
            ================================================================ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25">
                <Swords size={11} /> Competitive Arena
              </span>
              {liveContests.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {liveContests.length} Live Now
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Coding Contests</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Join live rated arenas, host your own custom tournament, or practice any past round virtually.
            </p>
          </div>

          <button
            onClick={() => setHostOpen(true)}
            className="btn-primary !py-2.5 !px-4 text-xs self-start md:self-auto"
          >
            <Plus size={15} /> Host a Contest
          </button>
        </div>

        {/* ================================================================
            LIVE CONTESTS (PLAYABLE RIGHT NOW)
            ================================================================ */}
        {liveContests.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-2">
              <Radio size={14} className="animate-pulse" /> Live Now — Enter Arena
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {liveContests.map((c) => (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden surface rounded-2xl p-6 lg:p-7 border border-emerald-500/35 bg-gradient-to-br from-emerald-500/10 via-[var(--bg-surface)] to-[var(--bg-surface)] shadow-xl shadow-emerald-500/5"
                >
                  <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-wider">
                          <span className="h-1.5 w-1.5 rounded-full bg-black animate-ping" />
                          LIVE
                        </span>
                        <span className="text-xs font-mono text-emerald-300">
                          Ends in {formatCountdown(c.endTime)}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                        {c.title}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] max-w-xl leading-relaxed">
                        {c.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)] pt-1">
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} className="text-emerald-400" />
                          {c.durationMinutes} min
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Trophy size={13} className="text-amber-400" />
                          {c.problemCount} Problems (3 / 4 / 5 / 6 pts)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users size={13} className="text-[var(--accent)]" />
                          {c.registeredCount} Participants
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <NavLink
                        to={`/contests/${c._id}`}
                        className="btn-primary !py-3 !px-6 text-xs font-semibold flex items-center gap-2"
                      >
                        <Play size={14} /> Enter Contest Arena <ArrowRight size={14} />
                      </NavLink>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================
            UPCOMING CONTESTS (REGISTER OR PRACTICE VIRTUAL)
            ================================================================ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold flex items-center gap-2">
              <Calendar size={14} className="text-[var(--accent)]" />
              Upcoming Tournaments
            </h2>
            <span className="text-xs text-[var(--text-tertiary)]">
              {upcomingContests.length} Scheduled
            </span>
          </div>

          {upcomingContests.length === 0 ? (
            <div className="surface rounded-2xl p-8 text-center text-xs text-[var(--text-tertiary)]">
              No scheduled upcoming contests. Click{" "}
              <button
                onClick={() => setHostOpen(true)}
                className="text-[var(--accent)] hover:underline font-medium"
              >
                Host a Contest
              </button>{" "}
              to launch one right now!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingContests.map((c) => {
                const contestKey = c._id || c.id;
                return (
                  <div
                    key={contestKey}
                    className="surface p-5 rounded-2xl border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="pill text-[10px] !py-0.5">
                          {c.badge || "Rated"}
                        </span>
                        <span className="text-[11px] font-mono text-amber-400">
                          Starts in {formatCountdown(c.startTime)}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors mb-1.5">
                        {c.title}
                      </h3>
                      <p className="text-xs text-[var(--text-tertiary)] mb-4">
                        {c.difficulty || "1 Easy · 2 Medium · 1 Hard"} · {c.durationMinutes} mins
                      </p>
                    </div>

                    <div className="pt-3.5 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
                        <Users size={12} className="text-[var(--text-tertiary)]" />
                        {(c.registeredCount || 0).toLocaleString()} registered
                      </div>
                      <div className="flex items-center gap-2">
                        <NavLink
                          to={`/contests/${contestKey}?virtual=true`}
                          className="btn-ghost !text-xs !py-1.5 !px-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          title="Start a timed practice session immediately"
                        >
                          <Play size={11} /> Virtual
                        </NavLink>
                        <button
                          onClick={() => toggleRegister(contestKey, c.isRegistered)}
                          disabled={registering[contestKey]}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            c.isRegistered
                              ? "bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/30"
                              : "btn-secondary !text-xs !py-1.5 !px-3"
                          }`}
                        >
                          {c.isRegistered ? "✓ Registered" : "Register"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================================================================
            PAST CONTESTS (VIRTUAL PRACTICE & STANDINGS)
            ================================================================ */}
        {endedContests.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold flex items-center gap-2">
              <Award size={14} className="text-purple-400" />
              Past Contests — Virtual Practice
            </h2>
            <div className="surface rounded-2xl border border-[var(--border-default)] divide-y divide-[var(--border-subtle)] overflow-hidden">
              {endedContests.map((c) => (
                <div
                  key={c._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {c.title}
                    </div>
                    <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                      {new Date(c.startTime).toLocaleDateString()} · {c.durationMinutes} mins · {c.problemCount} problems
                    </div>
                  </div>
                  <NavLink
                    to={`/contests/${c._id}?virtual=true`}
                    className="btn-secondary !text-xs !py-1.5 !px-3 self-start sm:self-auto"
                  >
                    <Play size={12} /> Open Arena & Standings
                  </NavLink>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================
            CONTEST RULES & SCORING
            ================================================================ */}
        <div className="surface p-6 rounded-2xl border border-[var(--border-default)]">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Sparkles size={15} className="text-amber-400" />
            ICPC / LeetCode Contest Scoring
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[var(--text-secondary)] leading-relaxed">
            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <div className="font-semibold text-[var(--text-primary)] mb-1">Weighted Points (3 / 4 / 5 / 6)</div>
              Each round pairs 1 Easy, 2 Medium, and 1 Hard problem. Total score is the sum of accepted problem weights.
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <div className="font-semibold text-[var(--text-primary)] mb-1">Time & Wrong-Attempt Penalty</div>
              Ties on score are broken by lowest penalty time: last accepted minute plus 5 minutes per wrong submission before AC.
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <div className="font-semibold text-[var(--text-primary)] mb-1">Host Anytime</div>
              Use "Host a Contest" to spin up a private or open live round for friends, interview prep groups, or college clubs.
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          HOST A CONTEST MODAL
          ================================================================ */}
      <AnimatePresence>
        {hostOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="w-full max-w-md surface-elevated rounded-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Host a Contest</h2>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    Auto-generates 4 balanced DSA problems (1 Easy · 2 Med · 1 Hard)
                  </p>
                </div>
                <button
                  onClick={() => setHostOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                >
                  <X size={16} />
                </button>
              </div>

              {hostError && (
                <div className="p-3 rounded-lg bg-[var(--danger-soft)] border border-[var(--danger)]/30 text-xs text-[var(--danger)]">
                  {hostError}
                </div>
              )}

              <form onSubmit={handleHostSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    Contest Title
                  </label>
                  <input
                    type="text"
                    value={hostTitle}
                    onChange={(e) => setHostTitle(e.target.value)}
                    placeholder="e.g. Friday Night DSA Blitz #1"
                    className="input-field text-xs"
                    maxLength={100}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    Duration
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[45, 60, 90, 120].map((mins) => (
                      <button
                        type="button"
                        key={mins}
                        onClick={() => setHostDuration(mins)}
                        className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                          hostDuration === mins
                            ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
                            : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    Start Schedule
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2.5">
                    <button
                      type="button"
                      onClick={() => setHostStartNow(true)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                        hostStartNow
                          ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400"
                          : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
                      }`}
                    >
                      <Zap size={12} /> Start Live Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setHostStartNow(false)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                        !hostStartNow
                          ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
                          : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
                      }`}
                    >
                      <Calendar size={12} /> Schedule Later
                    </button>
                  </div>
                  {!hostStartNow && (
                    <input
                      type="datetime-local"
                      value={hostStartTime}
                      onChange={(e) => setHostStartTime(e.target.value)}
                      className="input-field text-xs"
                      required
                    />
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setHostOpen(false)}
                    className="btn-secondary !text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={hosting}
                    className="btn-primary !text-xs"
                  >
                    {hosting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> Creating…
                      </>
                    ) : hostStartNow ? (
                      <>
                        <Play size={13} /> Launch & Enter Arena
                      </>
                    ) : (
                      "Schedule Contest"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Contests;
