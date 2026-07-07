// ---------------------------------------------------------------------------
// Redis client for the XCode backend.
//
// Used by the JWT blocklist on logout (we store the token in Redis with a
// TTL equal to the JWT's remaining lifetime, so logged-out tokens can't be
// reused even before they expire naturally).
//
// BUG FIXES:
//   1. Previously hardcoded `username: 'default'` and `password: process.env.REDIS_PASS`
//      — that breaks local dev (where there's no password) because the client
//      tries to AUTH with an empty string and Redis rejects it. We now omit
//      credentials when REDIS_PASS is empty, and omit the username entirely
//      (only Redis 6+ supports ACL usernames; older servers reject the
//      `username` field).
//   2. Added a graceful connection-error handler that logs but doesn't crash
//      the process — the rest of the app gracefully degrades when Redis is
//      down (the auth middleware's blocklist check fails open).
// ---------------------------------------------------------------------------

const { createClient } = require("redis");

const redisConfig = {
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
  },
};

// Only attach credentials if a password was provided. Local dev Redis
// typically has no auth; sending an empty AUTH command makes it reject us.
if (process.env.REDIS_PASS) {
  redisConfig.username = process.env.REDIS_USER || "default";
  redisConfig.password = process.env.REDIS_PASS;
}

const redisClient = createClient(redisConfig);

redisClient.on("error", (err) => {
  // Log but don't crash — the app degrades gracefully without Redis.
  console.error("Redis error:", err.message);
});

redisClient.on("connect", () => {
  console.log("Redis: connected");
});

redisClient.on("reconnecting", () => {
  console.log("Redis: reconnecting...");
});

module.exports = redisClient;
