const { prisma } = require("../../config/prisma");
const { ApiError } = require("../../utils/apiError");

// Plan limits live in one place — matches your spec's Free/Pro/Enterprise
// tiers. null means unlimited.
const PLAN_LIMITS = {
  FREE: { maxProjects: 2, maxMembers: 5, maxTasks: 100 },
  PRO: { maxProjects: null, maxMembers: null, maxTasks: null },
  ENTERPRISE: { maxProjects: null, maxMembers: null, maxTasks: null },
};

async function getSubscription(organizationId) {
  const subscription = await prisma.subscription.findUnique({ where: { organizationId } });
  if (!subscription) {
    throw ApiError.notFound("Subscription not found for this organization");
  }
  return subscription;
}

function getLimitsForPlan(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
}

// Called before creating a project — throws if the org is at its plan's
// project limit. Free tier's whole value proposition depends on this
// actually being enforced, not just displayed as a number in the UI.
async function assertCanCreateProject(organizationId) {
  const subscription = await getSubscription(organizationId);
  const limits = getLimitsForPlan(subscription.plan);

  if (limits.maxProjects === null) return; // unlimited

  const currentCount = await prisma.project.count({ where: { organizationId } });
  if (currentCount >= limits.maxProjects) {
    throw ApiError.forbidden(
      `Your ${subscription.plan} plan allows up to ${limits.maxProjects} projects. Upgrade to Pro for unlimited projects.`
    );
  }
}

// Called before adding a member (invite, or accepting one) — checked
// against seats on the subscription record, not a hardcoded plan default,
// since seats can in principle be adjusted per-org later (e.g. add-on seats).
async function assertCanAddMember(organizationId) {
  const subscription = await getSubscription(organizationId);
  const limits = getLimitsForPlan(subscription.plan);

  if (limits.maxMembers === null) return;

  const currentCount = await prisma.organizationMember.count({ where: { organizationId } });
  if (currentCount >= subscription.seats) {
    throw ApiError.forbidden(
      `Your ${subscription.plan} plan allows up to ${subscription.seats} members. Upgrade to Pro for unlimited members.`
    );
  }
}

// Called before creating a task — counted across the whole organization,
// not per-project, matching how your spec describes the limit ("100 Tasks"
// under the Free plan, not "100 tasks per project").
async function assertCanCreateTask(organizationId) {
  const subscription = await getSubscription(organizationId);
  const limits = getLimitsForPlan(subscription.plan);

  if (limits.maxTasks === null) return;

  const projectIds = (
    await prisma.project.findMany({ where: { organizationId }, select: { id: true } })
  ).map((p) => p.id);

  const currentCount = await prisma.task.count({ where: { projectId: { in: projectIds } } });
  if (currentCount >= limits.maxTasks) {
    throw ApiError.forbidden(
      `Your ${subscription.plan} plan allows up to ${limits.maxTasks} tasks. Upgrade to Pro for unlimited tasks.`
    );
  }
}

// Simple upgrade/downgrade — no real payment processing here (that's a
// Stripe/payment-gateway integration, genuinely out of scope for this
// project), but this is the seam where that would plug in later.
async function changePlan(organizationId, newPlan) {
  if (!["FREE", "PRO", "ENTERPRISE"].includes(newPlan)) {
    throw ApiError.badRequest("Invalid plan");
  }

  const seatsForPlan = { FREE: 5, PRO: 999999, ENTERPRISE: 999999 };

  return prisma.subscription.update({
    where: { organizationId },
    data: { plan: newPlan, seats: seatsForPlan[newPlan] },
  });
}

module.exports = {
  PLAN_LIMITS,
  getSubscription,
  getLimitsForPlan,
  assertCanCreateProject,
  assertCanAddMember,
  assertCanCreateTask,
  changePlan,
};