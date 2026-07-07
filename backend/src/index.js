// ---------------------------------------------------------------------------
// XCode Backend - Application entry point.
//
// Wires together all route modules, mounts global middleware (helmet, cors,
// json parser, cookie parser), and starts the HTTP server.
//
// BUG FIXES:
//   1. The previous version's `InitializeConnection` caught connection errors
//      but logged them and exited silently. We now log clearly and exit with
//      a non-zero status code so the process manager (PM2, Docker, systemd)
//      knows we failed and can restart us.
//   2. We connect to MongoDB and Redis in parallel, but MongoDB is REQUIRED
//      while Redis is OPTIONAL (the auth middleware fails open if Redis is
//      down). Previously a Redis outage prevented the server from starting.
//   3. We add graceful shutdown handlers (SIGINT/SIGTERM) that close the
//      HTTP server and the MongoDB/Redis connections cleanly.
//   4. `app.set('trust proxy', 1)` is kept so express-rate-limit sees the
//      real client IP behind the EdgeFlow gateway / reverse proxy.
// ---------------------------------------------------------------------------

const express = require("express");
const app = express();

// Trust the first proxy so express-rate-limit sees the real client IP from
// X-Forwarded-For instead of the proxy's IP. Adjust the count (1) to match
// your deployment's proxy chain length (1 = EdgeFlow gateway in front of us).
app.set("trust proxy", 1);

require("dotenv").config();

const main = require("./config/db");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/userAuth");
const googleRouter = require("./routes/googleAuth");
const engagementRouter = require("./routes/userEngagement");
const redisClient = require("./config/redis");
const problemRouter = require("./routes/problemCreator");
const submitRouter = require("./routes/submit");
const aiRouter = require("./routes/aiChatting");
const videoRouter = require("./routes/videoCreator");
const discussionRouter = require("./routes/discussion");
const cors = require("cors");
const helmet = require("helmet");
const {
  authLimiter,
  oauthLimiter,
  aiChatLimiter,
} = require("./middleware/rateLimiters");
const {
  errorHandler,
  notFoundHandler,
} = require("./middleware/errorHandler");
const mongoose = require("mongoose");

// Helmet — secure HTTP headers. Mounted FIRST so all responses get them.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        mediaSrc: ["'self'", "https://res.cloudinary.com"],
        imgSrc: [
          "'self'",
          "data:",
          "https://lh3.googleusercontent.com",
          "https://res.cloudinary.com",
        ],
        connectSrc: [
          "'self'",
          process.env.CLIENT_URL || "http://localhost:5173",
        ],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// BUG FIX: add a body size limit so a malicious client can't exhaust memory
// by sending a 10GB JSON body. 1MB is plenty for our payloads (the largest
// is the problem create endpoint with reference solutions).
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/user", authRouter);
app.use("/user", googleRouter);
app.use("/user", engagementRouter);
app.use("/problem", problemRouter);
app.use("/submission", submitRouter);
app.use("/ai", aiRouter);
app.use("/video", videoRouter);
app.use("/discussion", discussionRouter);

// Health check endpoint — used by EdgeFlow's health-check scheduler and
// by container orchestrators (Docker, Kubernetes) to determine liveness.
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "xcode",
    timestamp: new Date().toISOString(),
    uptimeSec: Math.floor(process.uptime()),
  });
});

// Centralized error handling — mounted LAST so it catches:
//   - 404s for unmatched routes (notFoundHandler)
//   - Errors forwarded via next(err) from asyncHandler-wrapped controllers
//   - Errors thrown synchronously by Express middleware
app.use(notFoundHandler);
app.use(errorHandler);

const initializeConnection = async () => {
  try {
    // MongoDB is REQUIRED — without it, no endpoint can function.
    await main();
    console.log("MongoDB: connected");

    // Redis is OPTIONAL — we connect in the background and let the auth
    // middleware fail open if it's unavailable. Previously a Redis outage
    // would prevent the server from starting at all.
    redisClient.connect().catch((err) => {
      console.warn(
        "Redis: failed to connect, running in degraded mode (token blocklist disabled):",
        err.message,
      );
    });

    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });

    // Graceful shutdown
    let shuttingDown = false;
    const shutdown = async (signal) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`Received ${signal}, shutting down gracefully...`);
      server.close(() => console.log("HTTP server closed"));
      try {
        await mongoose.disconnect();
        if (redisClient.isOpen) await redisClient.quit();
      } catch (err) {
        console.error("Shutdown error:", err.message);
      }
      process.exit(0);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("unhandledRejection", (err) => {
      console.error("Unhandled rejection:", err);
    });
    process.on("uncaughtException", (err) => {
      console.error("Uncaught exception:", err);
      process.exit(1);
    });
  } catch (err) {
    console.error("FATAL: failed to start server:", err.message);
    process.exit(1);
  }
};

initializeConnection();
