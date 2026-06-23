// ---------------------------------------------------------------------------
// P2-7: Centralized error handling middleware.
//
// Two pieces:
//   1. asyncHandler(fn) — wraps an async controller so rejected promises
//      are forwarded to Express's error pipeline via next(err) instead of
//      silently disappearing or crashing the process.
//   2. errorHandler(err, req, res, next) — terminal middleware that logs
//      the error and returns a consistent JSON response.
//
// IMPORTANT — backward compatibility:
// The existing controllers hand-write `res.status(N).send("Error: " + err)`
// in their own try/catch blocks. Per the "preserve all APIs" requirement,
// we do NOT touch those. The centralized handler only fires for errors that
// reach next(err) — i.e., errors from asyncHandler-wrapped controllers OR
// errors thrown by Express itself (e.g. 404 from a missing route).
//
// The error response shape is intentionally compatible with the existing
// frontend error handling: axios catch blocks read `error.response?.data?.error`
// OR `error.response?.data?.message` OR fall back to the raw response text.
// We return `{ error: string, message: string }` so all three patterns work.
// ---------------------------------------------------------------------------

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const errorHandler = (err, req, res, next) => {
  // If headers were already sent, delegate to Express's default handler
  // (otherwise res.json() would throw "Cannot set headers after they are sent").
  if (res.headersSent) {
    return next(err);
  }

  // Determine status code — err.statusCode is set by our own controllers
  // (e.g. userProfile.js sets 404). Default to 500 for unexpected errors.
  const statusCode = err.statusCode || err.status || 500;

  // Log unexpected errors (4xx are usually client mistakes; 5xx are ours).
  // Use console.error so it goes to stderr.
  if (statusCode >= 500) {
    console.error(`[error] ${req.method} ${req.url}:`, err);
  } else {
    // Brief log for 4xx so we can spot abuse patterns.
    console.warn(`[client-error] ${statusCode} ${req.method} ${req.url}: ${err.message}`);
  }

  // In production, never leak stack traces or internal error details.
  // In development, include the message for easier debugging.
  const isDev = process.env.NODE_ENV !== 'production';
  const safeMessage = isDev
    ? err.message || 'Internal server error'
    : 'Internal server error';

  // Return a JSON shape compatible with all existing frontend error readers:
  //   - error.response.data.error    (used by AdminVideo, AdminUpload)
  //   - error.response.data.message  (used by authSlice, ChatAi)
  //   - error.response.data          (string fallback for older callers)
  res.status(statusCode).json({
    error: safeMessage,
    message: safeMessage,
  });
};

// 404 handler — mounted AFTER all routes so it only fires for unmatched paths.
// Returns the same JSON shape as errorHandler for consistency.
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.url}`,
    message: `Route not found: ${req.method} ${req.url}`,
  });
};

module.exports = { asyncHandler, errorHandler, notFoundHandler };
