const { PrismaClient } = require("@prisma/client");
const { env } = require("./env");

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__prisma__ ??
  new PrismaClient({
    log: env.isProduction ? ["error", "warn"] : ["query", "error", "warn"],
  });

if (!env.isProduction) {
  globalForPrisma.__prisma__ = prisma;
}

module.exports = { prisma };