const { Router } = require("express");
const controller = require("./organization.controller");
const { validate } = require("../../middleware/validate.middleware");
const { verifyJWT } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/rbac.middleware");
const {
  createOrganizationSchema,
  updateOrganizationSchema,
  organizationIdParamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
} = require("./organization.validation");

const router = Router();

// Every route here requires a logged-in user
router.use(verifyJWT);

router.post("/", validate(createOrganizationSchema), controller.createOrganization);
router.get("/", controller.getMyOrganizations);

router.get(
  "/:organizationId",
  validate(organizationIdParamSchema),
  controller.getOrganization
);

router.patch(
  "/:organizationId",
  validate(updateOrganizationSchema),
  requireRole("ADMIN"),
  controller.updateOrganization
);

router.delete(
  "/:organizationId",
  validate(organizationIdParamSchema),
  requireRole("OWNER"),
  controller.deleteOrganization
);

router.post(
  "/:organizationId/members",
  validate(inviteMemberSchema),
  requireRole("ADMIN"),
  controller.inviteMember
);

router.patch(
  "/:organizationId/members/:memberId",
  validate(updateMemberRoleSchema),
  requireRole("ADMIN"),
  controller.updateMemberRole
);

router.delete(
  "/:organizationId/members/:memberId",
  validate(removeMemberSchema),
  requireRole("ADMIN"),
  controller.removeMember
);

module.exports = router;