const { logger } = require("../config/logger");

function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger.log(level, `${req.method} ${req.originalUrl}`, {
      statusCode: res.statusCode,
      durationMs,
      userId: req.user?.id, // present on authenticated routes, undefined otherwise
    });
  });

  next();
}

module.exports = { requestLogger };