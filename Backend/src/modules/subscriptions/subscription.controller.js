const service = require("./subscription.service");
const { ApiResponse } = require("../../utils/apiResponse");
const { asyncHandler } = require("../../utils/asyncHandler");

const getSubscription = asyncHandler(async (req, res) => {
  const subscription = await service.getSubscription(req.params.organizationId);
  const limits = service.getLimitsForPlan(subscription.plan);
  new ApiResponse(200, { subscription, limits }, "Subscription fetched").send(res);
});

const changePlan = asyncHandler(async (req, res) => {
  const subscription = await service.changePlan(req.params.organizationId, req.body.plan);
  new ApiResponse(200, { subscription }, "Plan updated successfully").send(res);
});

module.exports = { getSubscription, changePlan };