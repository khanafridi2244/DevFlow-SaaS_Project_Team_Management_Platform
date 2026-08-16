const { prisma } = require("../../config/prisma");

// A single, reusable entry point for recording activity — every module
// that wants something to show up in the activity feed calls this
// instead of writing directly to prisma.activity itself. Keeps the
// "what actions get logged and how they're shaped" decision in one place.
async function logActivity({ organizationId, projectId = null, actorId, action, metadata = null }) {
  return prisma.activity.create({
    data: { organizationId, projectId, actorId, action, metadata },
  });
}

async function listOrganizationActivity(organizationId, { limit = 50 } = {}) {
  return prisma.activity.findMany({
    where: { organizationId },
    include: {
      actor: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

async function listProjectActivity(projectId, { limit = 50 } = {}) {
  return prisma.activity.findMany({
    where: { projectId },
    include: {
      actor: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

module.exports = { logActivity, listOrganizationActivity, listProjectActivity };