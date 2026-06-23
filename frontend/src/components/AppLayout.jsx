import { Outlet } from "react-router";
import Navbar from "./Navbar";

// ---------------------------------------------------------------------------
// AppLayout — wraps authenticated pages with the persistent Navbar.
// The <Outlet /> renders the matched child route (Dashboard, Problems, etc.).
// ---------------------------------------------------------------------------

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
