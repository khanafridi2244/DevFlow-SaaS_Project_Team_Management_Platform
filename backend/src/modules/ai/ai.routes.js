const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const controller = require("./ai.controller");
const { validate } = require("../../middleware/validate.middleware");
const { verifyJWT } = require("../../middleware/auth.middleware");
const { env } = require("../../config/env");
const {
  generatePlanSchema,
  generateTasksSchema,
  summarizeTaskSchema,
  generateDescriptionSchema,
  analyzeRiskSchema,
} = require("./ai.validation");

const router = Router();

router.use(verifyJWT);

// AI calls cost real money per request — a much tighter limit than the
// rest of the API, so one user can't rack up a huge Anthropic bill by
// spamming these endpoints (accidentally or otherwise).
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.nodeEnv === "test",
  message: { success: false, message: "AI request limit reached, please try again later" },
});

router.use(aiLimiter);

router.post("/generate-plan", validate(generatePlanSchema), controller.generatePlan);
router.post("/generate-tasks", validate(generateTasksSchema), controller.generateTasks);
router.get("/tasks/:taskId/summarize", validate(summarizeTaskSchema), controller.summarizeTask);
router.post(
  "/generate-description",
  validate(generateDescriptionSchema),
  controller.generateDescription
);
router.get("/projects/:projectId/risk", validate(analyzeRiskSchema), controller.analyzeRisk);

module.exports = router;