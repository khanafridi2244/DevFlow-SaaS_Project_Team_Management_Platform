const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { requestLogger } = require("./middleware/requestLogger.middleware");
const rateLimit = require("express-rate-limit");

const { env } = require("./config/env");
const { errorMiddleware } = require("./middleware/error.middleware");
const { ApiError } = require("./utils/apiError");

const { prisma } = require("./config/prisma");

const authRoutes = require("./modules/auth/auth.routes");
const organizationRoutes = require("./modules/organizations/organization.routes");
const projectRoutes = require("./modules/projects/project.routes");
const taskRoutes = require("./modules/tasks/task.routes");
const commentRoutes = require("./modules/comments/comment.routes");
const activityRoutes = require("./modules/activities/activity.routes");
const notificationRoutes = require("./modules/notifications/notification.routes");
const attachmentRoutes = require("./modules/attachments/attachment.routes");
const analyticsRoutes = require("./modules/analytics/analytics.routes");
const subscriptionRoutes = require("./modules/subscriptions/subscription.routes");
const aiRoutes = require("./modules/ai/ai.routes");


const app = express();

// ── Security & parsing ─────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: env.isProduction ? undefined : false, // relaxed in dev so tools like Postman/browser devtools aren't blocked
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allows the frontend (different origin) to load uploaded images/attachments
  })
);
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true, // required so the browser sends/receives auth cookies
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.use(requestLogger);

// ── Rate limiting ───────────────────────────────────────
// Tighter limit on auth routes specifically — these are the ones
// attackers try to brute-force (login, password reset, etc.)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.nodeEnv === "test",
  message: { success: false, message: "Too many attempts, please try again later" },
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.nodeEnv === "test",
});

app.use(globalLimiter);

// ── Health check ────────────────────────────────────────
// A load balancer or uptime monitor hitting /health wants to know the
// app can actually serve requests, not just that the Node process
// hasn't crashed — so this checks the database connection too.
// Redis is deliberately NOT checked here: the app degrades gracefully
// without it (see config/redis.js), so Redis being down shouldn't mark
// the whole service unhealthy.
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ success: true, message: "DevFlow API is running", database: "connected" });
  } catch (err) {
    res.status(503).json({ success: false, message: "Database unreachable", database: "disconnected" });
  }
});
// ── Routes ───────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/attachments", attachmentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/ai", aiRoutes);


// ── 404 handler ─────────────────────────────────────────
app.use((req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

// ── Centralized error handler (must be last) ────────────
app.use(errorMiddleware);

module.exports = { app };