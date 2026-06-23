import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, NavLink } from "react-router";
import { loginUser } from "../authSlice";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Code2,
  Trophy,
  Sparkles,
  Users,
  ArrowRight,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

const loginSchema = z.object({
  emailId: z.string().email("Invalid email"),
  password: z.string().min(8, "Password is too weak"),
});

// ===========================================================================
// XCODE Login — premium split-screen.
// Left: branding + feature list + stats. Right: auth card with Google primary.
// ===========================================================================

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => dispatch(loginUser(data));

  const FEATURES = [
    { icon: Code2, title: "500+ Problems", desc: "Curated DSA challenges" },
    { icon: Sparkles, title: "AI Mentor", desc: "Powered by Gemini" },
    { icon: Trophy, title: "Contests", desc: "Weekly competitions" },
    { icon: Users, title: "Community", desc: "Discussions & solutions" },
  ];

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)]">
      {/* ============ LEFT: Branding ============ */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden gradient-bg-hero">
        {/* Aurora blobs */}
        <div className="aurora-blob bg-blue-600 w-96 h-96 top-10 -left-20" />
        <div className="aurora-blob bg-purple-600 w-80 h-80 bottom-20 right-10" style={{ animationDelay: "5s" }} />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Code2 size={18} className="text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
              XCODE
            </span>
          </div>

          {/* Hero headline */}
          <div className="max-w-md">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl xl:text-5xl font-bold tracking-tight leading-tight mb-4"
            >
              Master Coding
              <br />
              <span className="gradient-text-blue">Interviews</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[15px] text-[var(--text-secondary)] leading-relaxed mb-8"
            >
              The modern coding platform for serious developers. Practice,
              compete, and learn with AI-powered guidance.
            </motion.p>

            {/* Feature grid */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-2 gap-3"
            >
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="glass rounded-lg p-3.5"
                  >
                    <Icon size={16} className="text-[var(--accent)] mb-2" />
                    <div className="text-[13px] font-medium text-[var(--text-primary)] mb-0.5">
                      {f.title}
                    </div>
                    <div className="text-[11px] text-[var(--text-tertiary)]">
                      {f.desc}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Stats footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center gap-6 text-[var(--text-tertiary)]"
          >
            <div>
              <div className="text-lg font-semibold text-[var(--text-primary)]">10K+</div>
              <div className="text-[11px]">Active developers</div>
            </div>
            <div className="h-8 w-px bg-[var(--border-subtle)]" />
            <div>
              <div className="text-lg font-semibold text-[var(--text-primary)]">500K+</div>
              <div className="text-[11px]">Problems solved</div>
            </div>
            <div className="h-8 w-px bg-[var(--border-subtle)]" />
            <div>
              <div className="text-lg font-semibold text-[var(--text-primary)]">98%</div>
              <div className="text-[11px]">Satisfaction rate</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ============ RIGHT: Auth card ============ */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Code2 size={18} className="text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight">XCODE</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight mb-1.5">
            Welcome back
          </h2>
          <p className="text-[13px] text-[var(--text-tertiary)] mb-6">
            Sign in to continue your coding journey
          </p>

          {/* Error banner */}
          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-md border border-[var(--danger)]/30 bg-[var(--danger-soft)] text-[13px] text-[var(--danger)]">
              {typeof error === "string" ? error : "Login failed. Please try again."}
            </div>
          )}

          {/* Google OAuth — PRIMARY CTA */}
          <a
            href={`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/user/auth/google`}
            className="btn-secondary w-full mb-3 !py-2.5"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">
              or
            </span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>

          {/* Email/password form — SECONDARY */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="input-field !pl-10"
                  {...register("emailId")}
                />
              </div>
              {errors.emailId && (
                <span className="text-[11px] text-[var(--danger)] mt-1 block">{errors.emailId.message}</span>
              )}
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="input-field !pl-10 !pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <span className="text-[11px] text-[var(--danger)] mt-1 block">{errors.password.message}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-2.5"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[13px] text-[var(--text-tertiary)] mt-6">
            Don't have an account?{" "}
            <NavLink to="/signup" className="text-[var(--accent)] hover:underline font-medium">
              Create one
            </NavLink>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
