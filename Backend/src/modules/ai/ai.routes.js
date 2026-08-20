const express = require("express");

const router = express.Router();

const aiController = require("./ai.controller");
const {
  generateProjectPlanSchema,
  generateTasksSchema,
  generateTaskDescriptionSchema,
  taskIdParamSchema,
  projectIdParamSchema,
} = require("./ai.validation");

const { authenticate } = require("../../middlewares/auth.middleware");

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    req.body = value;
    next();
  };
}

function validateParams(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    req.params = value;
    next();
  };
};

// Generate a complete project plan
router.post(
  "/project-plan",
  authenticate,
  validateBody(generateProjectPlanSchema),
  aiController.generateProjectPlan
);

// Generate tasks for a project
router.post(
  "/tasks",
  authenticate,
  validateBody(generateTasksSchema),
  aiController.generateTasks
);

// Generate a technical task description
router.post(
  "/task-description",
  authenticate,
  validateBody(generateTaskDescriptionSchema),
  aiController.generateTaskDescription
);

// Summarize task discussion
router.get(
  "/tasks/:taskId/summary",
  authenticate,
  validateParams(taskIdParamSchema),
  aiController.summarizeTaskDiscussion
);

// Analyze project risks
router.get(
  "/projects/:projectId/risk",
  authenticate,
  validateParams(projectIdParamSchema),
  aiController.analyzeProjectRisk
);

module.exports = router;