import axios from "axios";

// ---------------------------------------------------------------------------
// Centralized axios client.
//
// P2-2: Added a 401 response interceptor that:
//   1. Skips the interceptor for auth endpoints themselves (/user/login,
//      /user/register, /user/check) — those are expected to 401 when
//      credentials are wrong or absent, and the calling thunk handles it.
//   2. For all other endpoints: dispatches logoutUser to clear the stale
//      Redux state, then redirects to /login.
//
// The store is injected at runtime via `injectStore()` (called from
// store.js) to avoid a circular import: authSlice.js imports axiosClient,
// so axiosClient cannot import authSlice.js directly.
// ---------------------------------------------------------------------------

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

// --- Store injection (avoids circular import with authSlice) ---
let store = null;
export const injectStore = (s) => { store = s; };

// Auth endpoints that legitimately 401 — interceptor skips these.
// We match by URL substring so it works regardless of baseURL.
const AUTH_ENDPOINTS = [
    "/user/login",
    "/user/register",
    "/user/check",
    "/user/auth/google", // OAuth callback may 401 during handshake
];

const isAuthEndpoint = (url) => {
    if (!url) return false;
    return AUTH_ENDPOINTS.some((ep) => url.includes(ep));
};

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const url = error?.config?.url;

        // Only intercept 401s on NON-auth endpoints.
        // Auth endpoints handle their own 401s (e.g. wrong password → 401
        // → loginUser thunk rejects → Login.jsx shows error).
        if (status === 401 && store && !isAuthEndpoint(url)) {
            // Lazy-import the logout action to avoid circular dependency.
            // (authSlice.js imports axiosClient at module-load time, so we
            // can't import it statically here.)
            import("../authSlice").then(({ logoutUser }) => {
                store.dispatch(logoutUser());
                // Redirect to /login if we're in a browser context.
                // Use window.location for a hard redirect so any in-flight
                // React state is reset cleanly.
                if (typeof window !== "undefined" && window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
            }).catch(() => {
                // If the dynamic import fails (extremely unlikely), at least
                // force a redirect so the user isn't stuck on a broken page.
                if (typeof window !== "undefined") {
                    window.location.href = "/login";
                }
            });
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
