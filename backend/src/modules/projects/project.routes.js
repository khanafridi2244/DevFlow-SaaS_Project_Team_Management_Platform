const { Router } = require("express");
const controller = require("./project.controller");
const { validate } = require("../../middleware/validate.middleware");
const { verifyJWT } = require("../../middleware/auth.middleware");
const {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
  listProjectsQuerySchema,
  addProjectMemberSchema,
  removeProjectMemberSchema,
} = require("./project.validation");

const router = Router();

router.use(verifyJWT);

router.post("/", validate(createProjectSchema), controller.createProject);
router.get("/", validate(listProjectsQuerySchema), controller.listProjects);

router.get("/:projectId", validate(projectIdParamSchema), controller.getProject);
router.patch("/:projectId", validate(updateProjectSchema), controller.updateProject);
router.delete("/:projectId", validate(projectIdParamSchema), controller.deleteProject);

router.post(
  "/:projectId/members",
  validate(addProjectMemberSchema),
  controller.addProjectMember
);
router.delete(
  "/:projectId/members/:userId",
  validate(removeProjectMemberSchema),
  controller.removeProjectMember
);

module.exports = router;