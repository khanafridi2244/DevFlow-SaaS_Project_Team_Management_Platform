const service = require("./analytics.service");
const { ApiResponse } = require("../../utils/apiResponse");
const { asyncHandler } = require("../../utils/asyncHandler");

const getOverview = asyncHandler(async (req, res) => {
  const overview = await service.getOrganizationOverview(req.params.organizationId, req.user.id);
  new ApiResponse(200, overview, "Overview fetched").send(res);
});

const getTasksByPriority = asyncHandler(async (req, res) => {
  const data = await service.getTasksByPriority(req.params.organizationId, req.user.id);
  new ApiResponse(200, { byPriority: data }, "Tasks by priority fetched").send(res);
});

const getTasksByStatus = asyncHandler(async (req, res) => {
  const data = await service.getTasksByStatus(req.params.organizationId, req.user.id);
  new ApiResponse(200, { byStatus: data }, "Tasks by status fetched").send(res);
});

const getTeamWorkload = asyncHandler(async (req, res) => {
  const workload = await service.getTeamWorkload(req.params.organizationId, req.user.id);
  new ApiResponse(200, { workload }, "Team workload fetched").send(res);
});

const getProjectProgress = asyncHandler(async (req, res) => {
  const progress = await service.getProjectProgress(req.params.organizationId, req.user.id);
  new ApiResponse(200, { progress }, "Project progress fetched").send(res);
});

const getTasksCompletedPerWeek = asyncHandler(async (req, res) => {
  const weeks = req.query.weeks ? Number(req.query.weeks) : 8;
  const data = await service.getTasksCompletedPerWeek(req.params.organizationId, req.user.id, weeks);
  new ApiResponse(200, { series: data }, "Weekly completion trend fetched").send(res);
});

module.exports = {
  getOverview,
  getTasksByPriority,
  getTasksByStatus,
  getTeamWorkload,
  getProjectProgress,
  getTasksCompletedPerWeek,
};