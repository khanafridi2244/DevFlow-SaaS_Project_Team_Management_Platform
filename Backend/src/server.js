const http = require("http");
const { app } = require("./app");
const { env } = require("./config/env");
const { prisma } = require("./config/prisma");
const { initSocket } = require("./config/socket");
const { connectRedis, redisClient } = require("./config/redis");

const httpServer = http.createServer(app);
initSocket(httpServer);

async function start() {
  // Redis is optional — if it fails to connect, log it and keep going.
  // The app should still boot and serve requests without caching.
  try {
    await connectRedis();
  } catch (err) {
    console.error("⚠️  Redis unavailable, continuing without caching:", err.message);
  }

  const server = httpServer.listen(env.port, () => {
    console.log(`✅ DevFlow API running on http://localhost:${env.port} [${env.nodeEnv}]`);
    console.log(`✅ Socket.IO listening for real-time connections`);
  });

  async function shutdown(signal) {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      if (redisClient.isOpen) await redisClient.quit();
      console.log("Server closed, DB and Redis disconnected.");
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

start();