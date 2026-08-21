const winston = require("winston");
const { env } = require("./env");

// Structured JSON logs in production (machine-readable, ready for a log
// aggregator like Datadog/CloudWatch), human-readable colored output in
// dev. Same logger, different format depending on environment — nobody
// wants to read raw JSON while developing locally.
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
    return `${timestamp} ${level}: ${message} ${metaStr}`;
  })
);

const prodFormat = winston.format.combine(winston.format.timestamp(), winston.format.json());

const logger = winston.createLogger({
  level: env.isProduction ? "info" : "debug",
  format: env.isProduction ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
  silent: env.nodeEnv === "test", // keep test output clean, same reasoning as the Prisma query-log change
});

module.exports = { logger };