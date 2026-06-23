import { Routes, Route, Navigate, useNavigate } from "react-router";
import { lazy, Suspense, useEffect, Component } from "react";
import { useDispatch, useSelector } from "react-redux";
import { checkAuth } from "./authSlice";
import AppLayout from "./components/AppLayout";

// Error Boundary — catches render errors and lazy-chunk load failures.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err, info) {
    console.error("Route error:", err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
          <div className="text-center">
            <p className="text-[var(--text-secondary)] mb-4 text-sm">
              Something went wrong.
            </p>
            <button
              className="btn-secondary"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Route-level code splitting via React.lazy.
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Homepage = lazy(() => import("./pages/Homepage"));
const Profile = lazy(() => import("./pages/Profile"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const NotesPage = lazy(() => import("./pages/Notes"));
const ProblemPage = lazy(() => import("./pages/ProblemPage"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));
const AdminVideo = lazy(() => import("./components/AdminVideo"));
const AdminDelete = lazy(() => import("./components/AdminDelete"));
const AdminUpload = lazy(() => import("./components/AdminUpload"));

const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
    <div className="flex flex-col items-center gap-3">
      <div className="h-6 w-6 rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)] animate-spin" />
      <span className="text-xs text-[var(--text-tertiary)]">Loading…</span>
    </div>
  </div>
);

// OAuth landing page: backend redirects here after setting the JWT cookie.
function GoogleAuthSuccess() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  return <RouteLoader />;
}

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (loading) {
    return <RouteLoader />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          {/* Auth routes — no navbar */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Signup />} />
          <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />

          {/* Authenticated routes — wrapped in AppLayout (with Navbar) */}
          <Route element={isAuthenticated ? <AppLayout /> : <Navigate to="/login" />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/problems" element={<Homepage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/admin" element={user?.role === "admin" ? <Admin /> : <Navigate to="/dashboard" />} />
            <Route path="/admin/create" element={user?.role === "admin" ? <AdminPanel /> : <Navigate to="/dashboard" />} />
            <Route path="/admin/delete" element={user?.role === "admin" ? <AdminDelete /> : <Navigate to="/dashboard" />} />
            <Route path="/admin/video" element={user?.role === "admin" ? <AdminVideo /> : <Navigate to="/dashboard" />} />
            <Route path="/admin/upload/:problemId" element={user?.role === "admin" ? <AdminUpload /> : <Navigate to="/dashboard" />} />
          </Route>

          {/* Problem page — full-screen, no navbar (LeetCode-style) */}
          <Route path="/problem/:problemId" element={<ProblemPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
