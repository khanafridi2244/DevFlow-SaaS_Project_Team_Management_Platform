const { Router } = require("express");
const { asyncHandler } = require("../../utils/asyncHandler");
const { ApiResponse } = require("../../utils/apiResponse");
const { ApiError } = require("../../utils/apiError");
const { prisma } = require("../../config/prisma");
const { verifyJWT } = require("../../middleware/auth.middleware");
const { assertOrgMembership } = require("../projects/project.service");
const service = require("./activity.service");

const router = Router();

router.use(verifyJWT);

router.get(
  "/organizations/:organizationId",
  asyncHandler(async (req, res) => {
    await assertOrgMembership(req.params.organizationId, req.user.id);
    const activities = await service.listOrganizationActivity(req.params.organizationId);
    new ApiResponse(200, { activities }, "Activity fetched").send(res);
  })
);

router.get(
  "/projects/:projectId",
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
    if (!project) {
      throw ApiError.notFound("Project not found");
    }
    await assertOrgMembership(project.organizationId, req.user.id);
    const activities = await service.listProjectActivity(req.params.projectId);
    new ApiResponse(200, { activities }, "Activity fetched").send(res);
  })
);

module.exports = router;