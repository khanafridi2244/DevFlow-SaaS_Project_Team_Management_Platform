const { Router } = require("express");
const controller = require("./task.controller");
const { validate } = require("../../middleware/validate.middleware");
const { verifyJWT } = require("../../middleware/auth.middleware");
const {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  taskIdParamSchema,
  listTasksQuerySchema,
  addLabelSchema,
  removeLabelSchema,
} = require("./task.validation");

const router = Router();

router.use(verifyJWT);

router.post("/", validate(createTaskSchema), controller.createTask);
router.get("/", validate(listTasksQuerySchema), controller.listTasks);

router.get("/:taskId", validate(taskIdParamSchema), controller.getTask);
router.patch("/:taskId", validate(updateTaskSchema), controller.updateTask);
router.patch("/:taskId/status", validate(updateTaskStatusSchema), controller.updateTaskStatus);
router.delete("/:taskId", validate(taskIdParamSchema), controller.deleteTask);

router.post("/:taskId/labels", validate(addLabelSchema), controller.addLabel);
router.delete("/:taskId/labels/:labelId", validate(removeLabelSchema), controller.removeLabel);

module.exports = router;