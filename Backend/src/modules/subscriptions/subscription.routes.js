const { Router } = require("express");
const controller = require("./subscription.controller");
const { verifyJWT } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/rbac.middleware");

const router = Router();

router.use(verifyJWT);

router.get("/:organizationId", controller.getSubscription);
router.patch("/:organizationId", requireRole("OWNER"), controller.changePlan);

module.exports = router;