const service = require("./organization.service");
const { ApiResponse } = require("../../utils/apiResponse");
const { asyncHandler } = require("../../utils/asyncHandler");

const createOrganization = asyncHandler(async (req, res) => {
  const organization = await service.createOrganization(req.user.id, req.body);
  new ApiResponse(201, { organization }, "Organization created successfully").send(res);
});

const getMyOrganizations = asyncHandler(async (req, res) => {
  const organizations = await service.getUserOrganizations(req.user.id);
  new ApiResponse(200, { organizations }, "Organizations fetched").send(res);
});

const getOrganization = asyncHandler(async (req, res) => {
  const organization = await service.getOrganizationById(req.params.organizationId, req.user.id);
  new ApiResponse(200, { organization }, "Organization fetched").send(res);
});

const updateOrganization = asyncHandler(async (req, res) => {
  const organization = await service.updateOrganization(req.params.organizationId, req.body);
  new ApiResponse(200, { organization }, "Organization updated successfully").send(res);
});

const deleteOrganization = asyncHandler(async (req, res) => {
  await service.deleteOrganization(req.params.organizationId);
  new ApiResponse(200, null, "Organization deleted successfully").send(res);
});

const inviteMember = asyncHandler(async (req, res) => {
  const membership = await service.inviteMember(req.params.organizationId, req.body);
  new ApiResponse(201, { membership }, "Member added successfully").send(res);
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const membership = await service.updateMemberRole(
    req.params.organizationId,
    req.params.memberId,
    req.body.role,
    req.user.id
  );
  new ApiResponse(200, { membership }, "Member role updated successfully").send(res);
});

const removeMember = asyncHandler(async (req, res) => {
  await service.removeMember(req.params.organizationId, req.params.memberId);
  new ApiResponse(200, null, "Member removed successfully").send(res);
});

module.exports = {
  createOrganization,
  getMyOrganizations,
  getOrganization,
  updateOrganization,
  deleteOrganization,
  inviteMember,
  updateMemberRole,
  removeMember,
};