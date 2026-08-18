const { PrismaClient } = require("@prisma/client");
const { env } = require("./env");

// Verbose SQL logging is genuinely useful when you're manually debugging
// (npm run dev), but it drowns out the actual error when a test fails —
// so tests get a quiet log level, everything else gets the full detail.
function getLogLevel() {
  if (env.isProduction) return ["error", "warn"];
  if (env.nodeEnv === "test") return ["error", "warn"];
  return ["query", "error", "warn"];
}

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__prisma__ ??
  new PrismaClient({
    log: getLogLevel(),
  });

if (!env.isProduction) {
  globalForPrisma.__prisma__ = prisma;
}

module.exports = { prisma };