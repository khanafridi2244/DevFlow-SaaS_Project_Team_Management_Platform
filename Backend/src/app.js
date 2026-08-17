const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { env } = require("./config/env");
const { errorMiddleware } = require("./middleware/error.middleware");
const { ApiError } = require("./utils/apiError");

const authRoutes = require("./modules/auth/auth.routes");
const organizationRoutes = require("./modules/organizations/organization.routes");
const projectRoutes = require("./modules/projects/project.routes");
const taskRoutes = require("./modules/tasks/task.routes");
const commentRoutes = require("./modules/comments/comment.routes");
const activityRoutes = require("./modules/activities/activity.routes");
const notificationRoutes = require("./modules/notifications/notification.routes");
const attachmentRoutes = require("./modules/attachments/attachment.routes");




const app = express();

// ── Security & parsing ─────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true, // required so the browser sends/receives auth cookies
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

if (!env.isProduction) {
  app.use(morgan("dev"));
}

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
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "DevFlow API is running" });
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


// ── 404 handler ─────────────────────────────────────────
app.use((req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

// ── Centralized error handler (must be last) ────────────
app.use(errorMiddleware);

module.exports = { app };