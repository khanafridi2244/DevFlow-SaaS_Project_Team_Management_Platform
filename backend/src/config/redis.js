const { createClient } = require("redis");
const { env } = require("./env");

const redisClient = createClient({
  url: env.redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 3) return false; // stop retrying after 3 attempts
      return Math.min(retries * 200, 1000);
    },
  },
});

let hasLoggedError = false;
redisClient.on("error", (err) => {
  if (!hasLoggedError) {
    console.error("Redis unavailable, continuing without caching:", err.message);
    hasLoggedError = true;
  }
});

let isConnected = false;

async function connectRedis() {
  if (isConnected) return;
  await redisClient.connect();
  isConnected = true;
  console.log("✅ Redis connected");
}

async function cached(key, ttlSeconds, computeFn) {
  if (!isConnected) {
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

module.exports = { redisClient, connectRedis, cached, invalidatePrefix };