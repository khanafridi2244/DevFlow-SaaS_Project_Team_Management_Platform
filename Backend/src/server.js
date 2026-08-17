const http = require("http");
const { app } = require("./app");
const { env } = require("./config/env");
const { prisma } = require("./config/prisma");
const { initSocket } = require("./config/socket");

const httpServer = http.createServer(app);
initSocket(httpServer);

const server = httpServer.listen(env.port, () => {
  console.log(`✅ DevFlow API running on http://localhost:${env.port} [${env.nodeEnv}]`);
  console.log(`✅ Socket.IO listening for real-time connections`);
});

async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Server closed, DB disconnected.");
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});