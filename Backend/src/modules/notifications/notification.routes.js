const { Router } = require("express");
const { asyncHandler } = require("../../utils/asyncHandler");
const { ApiResponse } = require("../../utils/apiResponse");
const { verifyJWT } = require("../../middleware/auth.middleware");
const service = require("./notification.service");

const router = Router();

router.use(verifyJWT);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const unreadOnly = req.query.unreadOnly === "true";
    const notifications = await service.listMyNotifications(req.user.id, { unreadOnly });
    new ApiResponse(200, { notifications }, "Notifications fetched").send(res);
  })
);

router.patch(
  "/:notificationId/read",
  asyncHandler(async (req, res) => {
    await service.markAsRead(req.params.notificationId, req.user.id);
    new ApiResponse(200, null, "Notification marked as read").send(res);
  })
);

router.patch(
  "/read-all",
  asyncHandler(async (req, res) => {
    await service.markAllAsRead(req.user.id);
    new ApiResponse(200, null, "All notifications marked as read").send(res);
  })
);

module.exports = router;