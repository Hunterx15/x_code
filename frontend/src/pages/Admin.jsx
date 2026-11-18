import { useState } from "react";
import { NavLink } from "react-router";
import { motion } from "framer-motion";
import axiosClient from "../utils/axiosClient";
import {
  Plus,
  Trash2,
  Video,
  Database,
  Trophy,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Shield,
} from "lucide-react";

// ===========================================================================
// XCODE Admin Console — Dark Linear/Vercel Aesthetic
// Includes 1-click 60-problem LeetCode Catalog Seeder + Contest Hosting
// ===========================================================================

function Admin() {
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [seedError, setSeedError] = useState(null);

  const handleSeedCatalog = async () => {
    if (seeding) return;
    setSeeding(true);
    setSeedResult(null);
    setSeedError(null);
    try {
      const { data } = await axiosClient.post("/problem/seed");
      setSeedResult(
        `Seeded ${data.inserted} new problems (${data.totalInDb} total in catalog).`
      );
    } catch (err) {
      setSeedError(err?.response?.data?.error || "Failed to seed catalog");
    } finally {
      setSeeding(false);
    }
  };

  const adminCards = [
    {
      id: "create",
      title: "Create Problem",
      description:
        "Author a new coding challenge with visible/hidden test cases and reference code.",
      icon: Plus,
      accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
      route: "/admin/create",
      cta: "Create Problem",
    },
    {
      id: "delete",
      title: "Manage & Delete",
      description: "Audit existing problems and remove deprecated or duplicate challenges.",
      icon: Trash2,
      accent: "text-rose-400 bg-rose-500/10 border-rose-500/25",
      route: "/admin/delete",
      cta: "Manage Problems",
    },
    {
      id: "video",
      title: "Video Editorials",
      description: "Upload, preview, and attach Cloudinary video walkthroughs to problems.",
      icon: Video,
      accent: "text-purple-400 bg-purple-500/10 border-purple-500/25",
      route: "/admin/video",
      cta: "Manage Videos",
    },
    {
      id: "contests",
      title: "Host a Contest",
      description: "Launch a live rated competition or schedule upcoming weekly tournaments.",
      icon: Trophy,
      accent: "text-amber-400 bg-amber-500/10 border-amber-500/25",
      route: "/contests",
      cta: "Open Contests Hub",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-grid-subtle">
      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 mb-2">
              <Shield size={11} /> Admin Console
            </span>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              Platform Operations
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Manage problems, seed the LeetCode catalog, upload editorials, and host contests.
            </p>
          </div>
        </div>

        {/* 1-Click 60-Problem LeetCode Seeder */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface rounded-2xl p-6 border border-[var(--accent)]/30 bg-gradient-to-br from-blue-500/10 via-[var(--bg-surface)] to-[var(--bg-surface)] flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] flex-shrink-0">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Sync 60 Curated LeetCode Problems
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 max-w-xl">
                Idempotently seeds 24 Easy, 24 Medium, and 12 Hard DSA challenges across all 10 topics with verified Judge0 test cases and JS/C++/Java starter & reference solutions.
              </p>
              {seedResult && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 size={14} /> {seedResult}
                </div>
              )}
              {seedError && (
                <div className="mt-2 text-xs text-rose-400">{seedError}</div>
              )}
            </div>
          </div>

          <button
            onClick={handleSeedCatalog}
            disabled={seeding}
            className="btn-primary !py-2.5 !px-4 text-xs self-start md:self-auto"
          >
            {seeding ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Seeding…
              </>
            ) : (
              <>
                <Database size={14} /> Seed 60 Problems
              </>
            )}
          </button>
        </motion.div>

        {/* Admin Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminCards.map((card) => {
            const Icon = card.icon;
            return (
              <NavLink
                key={card.id}
                to={card.route}
                className="surface rounded-2xl p-6 border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-all group flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`h-10 w-10 rounded-xl border flex items-center justify-center mb-4 ${card.accent}`}
                  >
                    <Icon size={18} />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors mb-1.5">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-5">
                    {card.description}
                  </p>
                </div>
                <span className="text-xs font-medium text-[var(--accent)] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  {card.cta} <ArrowRight size={13} />
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Admin;
