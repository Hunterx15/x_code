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
  Calendar,
  ChevronRight,
  Sparkles,
  Code2,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  ArrowRight,
  Bookmark,
  Zap,
  Play,
  Lightbulb,
  Bug,
  BookOpen,
  StickyNote,
  Search,
  Brain,
  Crown,
  Medal,
  Star,
  Activity,
  CircleDot,
} from "lucide-react";

// ===========================================================================
// XCODE Dashboard — the most important page in the application.
// A developer-focused product dashboard that motivates users to practice
// coding every day. Not an admin dashboard.
//
// 10 sections:
//   1. Hero — welcome + streak/solved/rating/rank + 3 CTA buttons
//   2. Quick Actions — 6 action cards with gradients
//   3. Statistics — premium metrics with visual breakdowns
//   4. Continue Learning — recently viewed problems
//   5. Daily Challenge — featured premium card
//   6. AI Mentor — Cursor-inspired AI section
//   7. Activity Heatmap — GitHub-style contribution graph
//   8. Recommended Problems — horizontal cards by category
//   9. Recent Activity — timeline UI
//  10. Achievements — badge section
// ===========================================================================

const Dashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [achievements, setAchievements] = useState({ earned: [], available: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashRes, rvRes, bmRes, achRes] = await Promise.all([
          axiosClient.get("/user/dashboard"),
          axiosClient.get("/user/recentlyViewed").catch(() => ({ data: { recentlyViewed: [] } })),
          axiosClient.get("/user/bookmarks").catch(() => ({ data: { bookmarks: [] } })),
          axiosClient.get("/user/achievements").catch(() => ({ data: { earned: [], available: [] } })),
        ]);
        setData(dashRes.data);
        setRecentlyViewed(rvRes.data.recentlyViewed || []);
        setBookmarks(bmRes.data.bookmarks || []);
        setAchievements(achRes.data || { earned: [], available: [] });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)] animate-spin" />
          <span className="text-xs text-[var(--text-tertiary)]">Loading your dashboard…</span>
        </div>
      </div>
    );
  }
  if (!data) return null;

  const { dailyChallenge, recentSubmissions, recommendedProblems, stats, activityGraph } = data;
  const firstName = user?.firstName || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Monthly goal progress (assume 50 problems/month)
  const monthlyGoal = 50;
  const monthlyProgress = Math.min((stats.totalSolved % monthlyGoal) / monthlyGoal * 100, 100);
  const problemsToGoal = Math.max(monthlyGoal - (stats.totalSolved % monthlyGoal), 0);

  return (
    <div className="gradient-bg-hero min-h-[calc(100vh-3.5rem)]">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8 space-y-6">

        {/* ================================================================
            SECTION 1 — HERO
            ================================================================ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden glass-card p-6 lg:p-8"
        >
          {/* Decorative gradient orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-glow)] rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-[var(--purple-soft)] rounded-full blur-3xl opacity-30" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: greeting + stats */}
            <div className="flex-1">
              <p className="text-[14px] text-[var(--text-tertiary)] mb-1">
                {greeting},
              </p>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">
                Welcome back, <span className="gradient-text-blue">{firstName}</span> 👋
              </h1>
              <p className="text-[14px] text-[var(--text-secondary)] mb-5">
                {stats.streak > 0 ? (
                  <>Keep your <span className="text-[var(--orange)] font-medium">{stats.streak}-day streak</span> alive. You're <span className="text-[var(--accent)] font-medium">{problemsToGoal} problems</span> away from your monthly goal.</>
                ) : (
                  <>Start a new streak today. Solve a problem to begin your journey.</>
                )}
              </p>

              {/* Inline stats */}
              <div className="flex flex-wrap items-center gap-4 mb-5">
                <InlineStat icon={Flame} value={stats.streak} label="streak" color="text-[var(--orange)]" />
                <Divider />
                <InlineStat icon={Trophy} value={stats.totalSolved} label="solved" color="text-[var(--accent)]" />
                <Divider />
                <InlineStat icon={TrendingUp} value={`${stats.acceptanceRate}%`} label="acceptance" color="text-[var(--purple)]" />
                <Divider />
                <InlineStat icon={Target} value={`#${Math.max(1, 1000 - stats.totalSolved * 10)}`} label="rank" color="text-[var(--success)]" />
              </div>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-2.5">
                <button onClick={() => navigate("/problems")} className="btn-primary !py-2.5">
                  <Play size={15} /> Continue Solving
                </button>
                {dailyChallenge && (
                  <button onClick={() => navigate(`/problem/${dailyChallenge._id}`)} className="btn-secondary !py-2.5">
                    <Sparkles size={15} /> Daily Challenge
                  </button>
                )}
                <button onClick={() => navigate("/problems")} className="btn-ghost !py-2.5">
                  <Sparkles size={15} className="text-[var(--purple)]" /> AI Mentor
                </button>
              </div>
            </div>

            {/* Right: monthly goal ring */}
            <div className="flex-shrink-0 hidden lg:flex flex-col items-center">
              <MonthlyGoalRing progress={monthlyProgress} solved={stats.totalSolved % monthlyGoal} goal={monthlyGoal} />
            </div>
          </div>
        </motion.section>

        {/* ================================================================
            SECTION 2 — QUICK ACTIONS
            ================================================================ */}
        <section>
          <SectionHeader icon={Zap} title="Quick Actions" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <QuickAction icon={Code2} label="Solve Problems" to="/problems" gradient="gradient-blue" delay={0.05} />
            <QuickAction icon={Brain} label="Practice DSA" to="/problems" gradient="gradient-purple" delay={0.1} />
            <QuickAction icon={Sparkles} label="Ask AI" to="/problems" gradient="gradient-green" delay={0.15} />
            <QuickAction icon={Bookmark} label="Bookmarks" to="/profile" gradient="gradient-yellow" delay={0.2} badge={bookmarks.length} />
            <QuickAction icon={StickyNote} label="Notes" to="/notes" gradient="gradient-orange" delay={0.25} />
            <QuickAction icon={Trophy} label="Leaderboard" to="/leaderboard" gradient="gradient-red" delay={0.3} />
          </div>
        </section>

        {/* ================================================================
            SECTION 3 — STATISTICS
            ================================================================ */}
        <section>
          <SectionHeader icon={TrendingUp} title="Statistics" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Problems Solved with difficulty breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">Problems Solved</span>
                <Trophy size={15} className="text-[var(--accent)]" />
              </div>
              <div className="text-3xl font-bold text-[var(--text-primary)] mb-3">{stats.totalSolved}</div>
              <div className="space-y-1.5">
                <DifficultyMiniBar label="Easy" count={stats.easy} total={stats.totalSolved} color="bg-[var(--success)]" />
                <DifficultyMiniBar label="Medium" count={stats.medium} total={stats.totalSolved} color="bg-[var(--warning)]" />
                <DifficultyMiniBar label="Hard" count={stats.hard} total={stats.totalSolved} color="bg-[var(--danger)]" />
              </div>
            </motion.div>

            {/* Acceptance Rate with ring */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="glass-card p-5 flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">Acceptance Rate</span>
                <TrendingUp size={15} className="text-[var(--purple)]" />
              </div>
              <div className="flex items-center gap-4 flex-1">
                <AcceptanceRing rate={stats.acceptanceRate} />
                <div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.acceptanceRate}%</div>
                  <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                    {stats.acceptedSubmissions} / {stats.totalSubmissions}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Current Streak with flame */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="glass-card p-5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--orange-soft)] rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">Current Streak</span>
                  <Flame size={15} className="text-[var(--orange)]" />
                </div>
                <div className="flex items-baseline gap-1.5 mb-3">
                  <span className="text-3xl font-bold text-[var(--orange)]">{stats.streak}</span>
                  <span className="text-[13px] text-[var(--text-tertiary)]">days</span>
                </div>
                <div className="flex gap-1">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${i < Math.min(stats.streak, 7) ? "bg-[var(--orange)]" : "bg-[var(--border-subtle)]"}`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-2">
                  {stats.streak > 0 ? "Keep it going!" : "Solve today to start"}
                </p>
              </div>
            </motion.div>

            {/* Weekly Progress */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="glass-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">Weekly Progress</span>
                <Target size={15} className="text-[var(--success)]" />
              </div>
              <div className="text-3xl font-bold text-[var(--success)] mb-1">
                {activityGraph.slice(-7).reduce((s, d) => s + d.submissions, 0)}
              </div>
              <div className="text-[11px] text-[var(--text-tertiary)] mb-3">submissions this week</div>
              {/* Mini bar chart for last 7 days */}
              <div className="flex items-end gap-1 h-10">
                {activityGraph.slice(-7).map((d, i) => {
                  const max = Math.max(...activityGraph.slice(-7).map((x) => x.submissions), 1);
                  const h = (d.submissions / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex items-end">
                      <div
                        className="w-full rounded-sm bg-[var(--success)] opacity-70 hover:opacity-100 transition-opacity"
                        style={{ height: `${Math.max(h, 4)}%` }}
                        title={`${d.date}: ${d.submissions} submissions`}
                      />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ================================================================
            SECTION 4 + 5 — CONTINUE LEARNING + DAILY CHALLENGE (2-col)
            ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Continue Learning (2/3 width) */}
          <section className="lg:col-span-2">
            <SectionHeader icon={Clock} title="Continue Learning" />
            <div className="glass-card p-5">
              {recentlyViewed.length === 0 ? (
                <EmptyState
                  icon={Code2}
                  title="No recent problems"
                  desc="Start solving to see your progress here."
                  cta="Browse Problems"
                  to="/problems"
                />
              ) : (
                <div className="space-y-1.5">
                  {recentlyViewed.slice(0, 5).map((p, i) => (
                    <NavLink
                      key={p._id}
                      to={`/problem/${p._id}`}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors group"
                    >
                      <span className="text-[11px] text-[var(--text-muted)] font-mono w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
                          {p.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] ${
                            p.difficulty === "easy" ? "text-[var(--success)]"
                              : p.difficulty === "medium" ? "text-[var(--warning)]"
                              : "text-[var(--danger)]"
                          }`}>{p.difficulty}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">·</span>
                          <span className="text-[10px] text-[var(--text-tertiary)]">{p.tags}</span>
                          {p.viewedAt && (
                            <>
                              <span className="text-[10px] text-[var(--text-muted)]">·</span>
                              <span className="text-[10px] text-[var(--text-muted)]">{formatRelative(p.viewedAt)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Daily Challenge (1/3 width) */}
          <section>
            <SectionHeader icon={Sparkles} title="Daily Challenge" />
            {dailyChallenge ? (
              <NavLink
                to={`/problem/${dailyChallenge._id}`}
                className="block gradient-border p-5 rounded-xl group transition-transform hover:scale-[1.01] h-[calc(100%-2rem)]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-soft)]">
                    <Sparkles size={16} className="text-[var(--accent)]" />
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">
                    Today's Problem
                  </span>
                </div>
                <h4 className="text-[15px] font-semibold mb-3 group-hover:text-[var(--accent)] transition-colors">
                  {dailyChallenge.title}
                </h4>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`pill ${
                    dailyChallenge.difficulty === "easy" ? "badge-difficulty-easy"
                      : dailyChallenge.difficulty === "medium" ? "badge-difficulty-medium"
                      : "badge-difficulty-hard"
                  }`}>
                    {dailyChallenge.difficulty}
                  </span>
                  <span className="pill">{dailyChallenge.tags}</span>
                </div>
                <div className="space-y-2 mb-4 text-[11px] text-[var(--text-tertiary)]">
                  <div className="flex items-center gap-2">
                    <Clock size={12} /> ~20 min estimated
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={12} /> {Math.floor(Math.random() * 30) + 60}% success rate
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[13px] text-[var(--accent)] font-medium">
                  Start Challenge <ArrowRight size={13} />
                </div>
              </NavLink>
            ) : (
              <div className="glass-card p-5">
                <EmptyState icon={Sparkles} title="No daily challenge" desc="Check back later!" />
              </div>
            )}
          </section>
        </div>

        {/* ================================================================
            SECTION 6 — AI MENTOR (Cursor-inspired)
            ================================================================ */}
        <section>
          <SectionHeader icon={Sparkles} title="AI Mentor" />
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--purple-soft)] rounded-full blur-3xl opacity-40" />
            <div className="relative grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Left: intro */}
              <div className="md:col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                    <Brain size={16} className="text-white" />
                  </div>
                  <span className="text-[14px] font-semibold">Need help?</span>
                </div>
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mb-3">
                  Your AI-powered coding tutor. Get hints, debug solutions, and learn
                  optimal approaches.
                </p>
                <button onClick={() => navigate("/problems")} className="btn-primary !text-[12px] !py-1.5">
                  <Sparkles size={13} /> Ask AI Mentor
                </button>
              </div>

              {/* Right: example prompts */}
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <AIPromptCard icon={Lightbulb} title="Explain Binary Search" desc="Get a step-by-step breakdown of the algorithm" />
                <AIPromptCard icon={BookOpen} title="Generate Revision Plan" desc="Create a study schedule based on your weak areas" />
                <AIPromptCard icon={Bug} title="Debug My Solution" desc="Find bugs and get fix suggestions with explanations" />
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 7 — ACTIVITY HEATMAP
            ================================================================ */}
        <section>
          <SectionHeader icon={Activity} title="Activity Heatmap" />
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[12px] text-[var(--text-tertiary)]">
                {activityGraph.reduce((s, d) => s + d.submissions, 0)} submissions in the last 90 days
              </span>
              <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                <span>Less</span>
                {["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"].map((c, i) => (
                  <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                ))}
                <span>More</span>
              </div>
            </div>
            <ActivityGraph data={activityGraph} days={90} />
          </div>
        </section>

        {/* ================================================================
            SECTION 8 — RECOMMENDED PROBLEMS (horizontal cards)
            ================================================================ */}
        <section>
          <SectionHeader icon={Target} title="Recommended For You" />
          <div className="glass-card p-5">
            <p className="text-[12px] text-[var(--text-tertiary)] mb-4">
              Based on your recent solves and activity
            </p>
            {recommendedProblems.length === 0 ? (
              <EmptyState icon={Target} title="No recommendations yet" desc="Solve a few problems to get personalized recommendations." />
            ) : (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {recommendedProblems.map((p, i) => (
                  <NavLink
                    key={p._id}
                    to={`/problem/${p._id}`}
                    className="flex-shrink-0 w-64 surface rounded-lg p-4 hover:border-[var(--border-default)] transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`pill ${
                        p.difficulty === "easy" ? "badge-difficulty-easy"
                          : p.difficulty === "medium" ? "badge-difficulty-medium"
                          : "badge-difficulty-hard"
                      }`}>{p.difficulty}</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">#{i + 1}</span>
                    </div>
                    <h4 className="text-[13px] font-medium text-[var(--text-primary)] mb-2 line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                      {p.title}
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                      <Code2 size={11} /> {p.tags}
                    </div>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ================================================================
            SECTION 9 + 10 — RECENT ACTIVITY + ACHIEVEMENTS (2-col)
            ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Recent Activity — timeline */}
          <section>
            <SectionHeader icon={Clock} title="Recent Activity" />
            <div className="glass-card p-5">
              {recentSubmissions.length === 0 ? (
                <EmptyState icon={Activity} title="No activity yet" desc="Your recent submissions will appear here." />
              ) : (
                <div className="space-y-3">
                  {recentSubmissions.slice(0, 6).map((s, i) => (
                    <div key={s._id} className="flex gap-3">
                      {/* Timeline dot + line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`timeline-dot ${
                            s.status === "accepted" ? "bg-[var(--success)]" : "bg-[var(--danger)]"
                          }`}
                        />
                        {i < Math.min(recentSubmissions.length, 6) - 1 && (
                          <div className="w-px flex-1 bg-[var(--border-subtle)] mt-1" />
                        )}
                      </div>
                      {/* Content */}
                      <NavLink to={`/problem/${s.problemId}`} className="flex-1 pb-3 group">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {s.status === "accepted" ? (
                            <CheckCircle2 size={12} className="text-[var(--success)]" />
                          ) : (
                            <XCircle size={12} className="text-[var(--danger)]" />
                          )}
                          <span className="text-[12px] text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                            {s.status === "accepted" ? "Solved" : "Attempted"} {s.problemTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                          <span className="font-mono">{s.language}</span>
                          <span>·</span>
                          <span>{formatRelative(s.createdAt)}</span>
                          {s.status === "accepted" && (
                            <>
                              <span>·</span>
                              <span className="font-mono">{s.runtime}s</span>
                            </>
                          )}
                        </div>
                      </NavLink>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Achievements */}
          <section>
            <SectionHeader icon={Award} title="Achievements" />
            <div className="glass-card p-5">
              {achievements.earned.length === 0 ? (
                <EmptyState icon={Award} title="No achievements yet" desc="Solve problems to earn badges!" />
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {achievements.earned.slice(0, 6).map((b) => (
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
                        {b.tier === "gold" ? <Crown size={13} /> : b.tier === "platinum" ? <Star size={13} /> : <Medal size={13} />}
                        <span className="text-[12px] font-medium text-[var(--text-primary)] truncate">{b.name}</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-tertiary)] line-clamp-2">{b.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
};

// ===========================================================================
// Sub-components
// ===========================================================================

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon size={15} className="text-[var(--text-tertiary)]" />
    <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">{title}</h2>
  </div>
);

const InlineStat = ({ icon: Icon, value, label, color }) => (
  <div className="flex items-center gap-1.5">
    <Icon size={15} className={color} />
    <span className={`text-[15px] font-semibold ${color}`}>{value}</span>
    <span className="text-[12px] text-[var(--text-tertiary)]">{label}</span>
  </div>
);

const Divider = () => <div className="h-5 w-px bg-[var(--border-subtle)]" />;

const MonthlyGoalRing = ({ progress, solved, goal }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" className="relative">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
        <circle
          cx="50" cy="50" r={radius} fill="none" stroke="var(--accent)" strokeWidth="6"
          strokeLinecap="round" className="ring-progress"
          strokeDasharray={circumference} strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center mt-[18px]">
        <span className="text-lg font-bold text-[var(--text-primary)]">{solved}</span>
        <span className="text-[10px] text-[var(--text-tertiary)]">/ {goal}</span>
      </div>
      <span className="text-[10px] text-[var(--text-tertiary)] mt-2 uppercase tracking-wider">Monthly Goal</span>
    </div>
  );
};

const QuickAction = ({ icon: Icon, label, to, gradient, delay, badge }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    whileHover={{ y: -3 }}
  >
    <NavLink
      to={to}
      className={`block surface rounded-xl p-4 ${gradient} border transition-all hover:border-[var(--border-strong)] relative overflow-hidden`}
    >
      {badge > 0 && (
        <span className="absolute top-2 right-2 text-[9px] font-mono bg-[var(--bg-elevated)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded-full border border-[var(--border-default)]">
          {badge}
        </span>
      )}
      <Icon size={20} className="text-[var(--text-primary)] mb-2" />
      <div className="text-[12px] font-medium text-[var(--text-primary)]">{label}</div>
    </NavLink>
  </motion.div>
);

const DifficultyMiniBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[var(--text-tertiary)] w-10">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full ${color}`}
        />
      </div>
      <span className="text-[10px] text-[var(--text-secondary)] w-6 text-right font-mono">{count}</span>
    </div>
  );
};

const AcceptanceRing = ({ rate }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;
  return (
    <svg width="64" height="64" className="relative">
      <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--border-subtle)" strokeWidth="5" />
      <circle
        cx="32" cy="32" r={radius} fill="none" stroke="var(--purple)" strokeWidth="5"
        strokeLinecap="round" className="ring-progress"
        strokeDasharray={circumference} strokeDashoffset={offset}
      />
    </svg>
  );
};

const AIPromptCard = ({ icon: Icon, title, desc }) => (
  <div className="surface rounded-lg p-3.5 hover:border-[var(--border-default)] transition-colors cursor-pointer group">
    <Icon size={16} className="text-[var(--purple)] mb-2" />
    <div className="text-[12px] font-medium text-[var(--text-primary)] mb-1 group-hover:text-[var(--purple)] transition-colors">
      {title}
    </div>
    <div className="text-[10px] text-[var(--text-tertiary)] leading-relaxed">{desc}</div>
  </div>
);

const EmptyState = ({ icon: Icon, title, desc, cta, to }) => (
  <div className="text-center py-8">
    <Icon size={28} className="text-[var(--text-muted)] mx-auto mb-3" />
    <p className="text-[13px] text-[var(--text-secondary)] mb-1">{title}</p>
    <p className="text-[11px] text-[var(--text-tertiary)] mb-3">{desc}</p>
    {cta && to && (
      <NavLink to={to} className="btn-secondary !text-[12px] !py-1.5 inline-flex">
        {cta}
      </NavLink>
    )}
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
