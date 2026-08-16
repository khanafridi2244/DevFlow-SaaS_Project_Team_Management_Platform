const service = require("./task.service");
const { ApiResponse } = require("../../utils/apiResponse");
const { asyncHandler } = require("../../utils/asyncHandler");

const createTask = asyncHandler(async (req, res) => {
  const task = await service.createTask(req.user.id, req.body);
  new ApiResponse(201, { task }, "Task created successfully").send(res);
});

const listTasks = asyncHandler(async (req, res) => {
  const tasks = await service.listTasks(req.user.id, req.query);
  new ApiResponse(200, { tasks }, "Tasks fetched").send(res);
});

const getTask = asyncHandler(async (req, res) => {
  const task = await service.getTaskById(req.params.taskId, req.user.id);
  new ApiResponse(200, { task }, "Task fetched").send(res);
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await service.updateTask(req.params.taskId, req.user.id, req.body);
  new ApiResponse(200, { task }, "Task updated successfully").send(res);
});

const updateTaskStatus = asyncHandler(async (req, res) => {
  const task = await service.updateTaskStatus(req.params.taskId, req.user.id, req.body.status);
  new ApiResponse(200, { task }, "Task status updated").send(res);
});

const deleteTask = asyncHandler(async (req, res) => {
  await service.deleteTask(req.params.taskId, req.user.id);
  new ApiResponse(200, null, "Task deleted successfully").send(res);
});

const addLabel = asyncHandler(async (req, res) => {
  const label = await service.addLabel(req.params.taskId, req.user.id, req.body);
  new ApiResponse(201, { label }, "Label added").send(res);
});

const removeLabel = asyncHandler(async (req, res) => {
  await service.removeLabel(req.params.taskId, req.params.labelId, req.user.id);
  new ApiResponse(200, null, "Label removed").send(res);
});

module.exports = {
  createTask,
  listTasks,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addLabel,
  removeLabel,
};