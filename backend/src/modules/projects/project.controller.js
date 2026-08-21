const service = require("./project.service");
const { ApiResponse } = require("../../utils/apiResponse");
const { asyncHandler } = require("../../utils/asyncHandler");

const createProject = asyncHandler(async (req, res) => {
  const project = await service.createProject(req.user.id, req.body);
  new ApiResponse(201, { project }, "Project created successfully").send(res);
});

const listProjects = asyncHandler(async (req, res) => {
  const projects = await service.listProjects(req.user.id, req.query);
  new ApiResponse(200, { projects }, "Projects fetched").send(res);
});

const getProject = asyncHandler(async (req, res) => {
  const project = await service.getProjectById(req.params.projectId, req.user.id);
  new ApiResponse(200, { project }, "Project fetched").send(res);
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await service.updateProject(req.params.projectId, req.user.id, req.body);
  new ApiResponse(200, { project }, "Project updated successfully").send(res);
});

const deleteProject = asyncHandler(async (req, res) => {
  await service.deleteProject(req.params.projectId, req.user.id);
  new ApiResponse(200, null, "Project deleted successfully").send(res);
});

const addProjectMember = asyncHandler(async (req, res) => {
  const membership = await service.addProjectMember(
    req.params.projectId,
    req.user.id,
    req.body.userId
  );
  new ApiResponse(201, { membership }, "Member added to project").send(res);
});

const removeProjectMember = asyncHandler(async (req, res) => {
  await service.removeProjectMember(req.params.projectId, req.user.id, req.params.userId);
  new ApiResponse(200, null, "Member removed from project").send(res);
});

module.exports = {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
};