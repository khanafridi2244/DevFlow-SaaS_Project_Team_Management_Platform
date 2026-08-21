const service = require("./ai.service");
const { ApiResponse } = require("../../utils/apiResponse");
const { asyncHandler } = require("../../utils/asyncHandler");

const generatePlan = asyncHandler(async (req, res) => {
  const { organizationId, description } = req.body;
  const plan = await service.generateProjectPlan(organizationId, req.user.id, description);
  new ApiResponse(200, plan, "Project plan generated").send(res);
});

const generateTasks = asyncHandler(async (req, res) => {
  const { projectId, instruction } = req.body;
  const result = await service.generateTasks(projectId, req.user.id, instruction);
  new ApiResponse(200, result, "Tasks generated").send(res);
});

const summarizeTask = asyncHandler(async (req, res) => {
  const result = await service.summarizeTaskDiscussion(req.params.taskId, req.user.id);
  new ApiResponse(200, result, "Discussion summarized").send(res);
});

const generateDescription = asyncHandler(async (req, res) => {
  const { title, projectContext } = req.body;
  const result = await service.generateTaskDescription(title, projectContext);
  new ApiResponse(200, result, "Description generated").send(res);
});

const analyzeRisk = asyncHandler(async (req, res) => {
  const result = await service.analyzeProjectRisk(req.params.projectId, req.user.id);
  new ApiResponse(200, result, "Risk analysis complete").send(res);
});

module.exports = { generatePlan, generateTasks, summarizeTask, generateDescription, analyzeRisk };