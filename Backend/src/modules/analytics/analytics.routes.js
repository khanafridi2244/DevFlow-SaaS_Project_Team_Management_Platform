const { Router } = require("express");
const controller = require("./analytics.controller");
const { verifyJWT } = require("../../middleware/auth.middleware");

const router = Router();

router.use(verifyJWT);

router.get("/:organizationId/overview", controller.getOverview);
router.get("/:organizationId/tasks-by-priority", controller.getTasksByPriority);
router.get("/:organizationId/tasks-by-status", controller.getTasksByStatus);
router.get("/:organizationId/team-workload", controller.getTeamWorkload);
router.get("/:organizationId/project-progress", controller.getProjectProgress);
router.get("/:organizationId/completed-per-week", controller.getTasksCompletedPerWeek);

module.exports = router;