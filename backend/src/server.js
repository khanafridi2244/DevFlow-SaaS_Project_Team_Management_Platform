const http = require("http");
const { app } = require("./app");
const { env } = require("./config/env");
const { prisma } = require("./config/prisma");
const { initSocket } = require("./config/socket");
const { connectRedis, redisClient } = require("./config/redis");
const { logger } = require("./config/logger");

const httpServer = http.createServer(app);
initSocket(httpServer);

async function start() {
  try {
    await connectRedis();
  } catch (err) {
    logger.warn("Redis unavailable, continuing without caching", { error: err.message });
  }

  const server = httpServer.listen(env.port, () => {
    logger.info(`DevFlow API running on port ${env.port}`, { env: env.nodeEnv });
    logger.info("Socket.IO listening for real-time connections");
  });

  async function shutdown(signal) {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      if (redisClient.isOpen) await redisClient.quit();
      logger.info("Server closed, DB and Redis disconnected");
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection", { reason: String(reason) });
});

start();