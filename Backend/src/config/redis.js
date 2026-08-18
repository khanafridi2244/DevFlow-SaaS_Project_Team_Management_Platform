const { createClient } = require("redis");
const { env } = require("./env");

const redisClient = createClient({ url: env.redisUrl });

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err.message);
});

let isConnected = false;

// Lazily connects on first use rather than at module-load time — this
// matters for tests, which never call connectRedis() and shouldn't need
// a running Redis instance just to import this file.
async function connectRedis() {
  if (isConnected) return;
  await redisClient.connect();
  isConnected = true;
  console.log("✅ Redis connected");
}

// Cache helper: tries Redis first, falls back to computing fresh and
// storing the result if it's a cache miss (or Redis is unreachable).
// This wraps the "check cache, else run query, then cache it" pattern
// so callers don't repeat that logic everywhere.
async function cached(key, ttlSeconds, computeFn) {
  if (!isConnected) {
    // Redis not available (e.g. not configured, or down) — just compute
    // directly. Caching is a performance optimization, not a dependency
    // the app should break without.
    return computeFn();
  }

  try {
    const existing = await redisClient.get(key);
    if (existing) {
      return JSON.parse(existing);
    }
  } catch (err) {
    console.error("Redis read failed, falling back to direct compute:", err.message);
    return computeFn();
  }

  const fresh = await computeFn();

  try {
    await redisClient.set(key, JSON.stringify(fresh), { EX: ttlSeconds });
  } catch (err) {
    console.error("Redis write failed (non-fatal):", err.message);
  }

  return fresh;
}

// Deletes all keys matching a prefix — used to invalidate an
// organization's cached analytics whenever its underlying data changes
// (a task is created, completed, etc).
async function invalidatePrefix(prefix) {
  if (!isConnected) return;
  try {
    const keys = await redisClient.keys(`${prefix}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    console.error("Redis invalidation failed (non-fatal):", err.message);
  }
}

module.exports = { 
    redisClient,
    connectRedis,
    cached, 
    invalidatePrefix
};
