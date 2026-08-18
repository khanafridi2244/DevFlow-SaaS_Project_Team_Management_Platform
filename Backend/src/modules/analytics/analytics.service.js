const { prisma } = require("../../config/prisma");
const { assertOrgMembership } = require("../projects/project.service");

// Every analytics query is scoped to an organization and requires the
// requester to actually belong to it — same permission chain as
// everything else, analytics just reads across projects instead of
// touching just one.
async function getOrganizationOverview(organizationId, userId) {
  await assertOrgMembership(organizationId, userId);

  const projectIds = (
    await prisma.project.findMany({ where: { organizationId }, select: { id: true } })
  ).map((p) => p.id);

  const [totalTasks, completedTasks, inProgressTasks, overdueTasks] = await Promise.all([
    prisma.task.count({ where: { projectId: { in: projectIds } } }),
    prisma.task.count({ where: { projectId: { in: projectIds }, status: "DONE" } }),
    prisma.task.count({ where: { projectId: { in: projectIds }, status: "IN_PROGRESS" } }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        status: { not: "DONE" },
        dueDate: { lt: new Date() },
      },
    }),
  ]);

  return { totalTasks, completedTasks, inProgressTasks, overdueTasks };
}

async function getTasksByPriority(organizationId, userId) {
  await assertOrgMembership(organizationId, userId);

  const projectIds = (
    await prisma.project.findMany({ where: { organizationId }, select: { id: true } })
  ).map((p) => p.id);

  const grouped = await prisma.task.groupBy({
    by: ["priority"],
    where: { projectId: { in: projectIds } },
    _count: { _all: true },
  });

  // Ensure every priority level appears even if it has zero tasks —
  // a chart component shouldn't have to handle "this key might not exist"
  const result = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
  grouped.forEach((g) => {
    result[g.priority] = g._count._all;
  });
  return result;
}

async function getTasksByStatus(organizationId, userId) {
  await assertOrgMembership(organizationId, userId);

  const projectIds = (
    await prisma.project.findMany({ where: { organizationId }, select: { id: true } })
  ).map((p) => p.id);

  const grouped = await prisma.task.groupBy({
    by: ["status"],
    where: { projectId: { in: projectIds } },
    _count: { _all: true },
  });

  const result = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
  grouped.forEach((g) => {
    result[g.status] = g._count._all;
  });
  return result;
}

async function getTeamWorkload(organizationId, userId) {
  await assertOrgMembership(organizationId, userId);

  const projectIds = (
    await prisma.project.findMany({ where: { organizationId }, select: { id: true } })
  ).map((p) => p.id);

  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
  });

  const workload = await Promise.all(
    members.map(async (m) => {
      const [assigned, completed] = await Promise.all([
        prisma.task.count({
          where: { projectId: { in: projectIds }, assigneeId: m.userId, status: { not: "DONE" } },
        }),
        prisma.task.count({
          where: { projectId: { in: projectIds }, assigneeId: m.userId, status: "DONE" },
        }),
      ]);
      return { user: m.user, role: m.role, activeTaskCount: assigned, completedTaskCount: completed };
    })
  );

  return workload;
}

async function getProjectProgress(organizationId, userId) {
  await assertOrgMembership(organizationId, userId);

  const projects = await prisma.project.findMany({
    where: { organizationId },
    include: { _count: { select: { tasks: true } } },
  });

  const progress = await Promise.all(
    projects.map(async (p) => {
      const completedCount = await prisma.task.count({
        where: { projectId: p.id, status: "DONE" },
      });
      const totalCount = p._count.tasks;
      const percentComplete = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

      return {
        projectId: p.id,
        projectName: p.name,
        status: p.status,
        totalTasks: totalCount,
        completedTasks: completedCount,
        percentComplete,
      };
    })
  );

  return progress;
}

// Tasks completed per week, for a trend chart. Returns the last N weeks
// (default 8) with a count for each — including weeks with zero
// completions, same "always fill the gaps" principle as the priority chart.
async function getTasksCompletedPerWeek(organizationId, userId, weeks = 8) {
  await assertOrgMembership(organizationId, userId);

  const projectIds = (
    await prisma.project.findMany({ where: { organizationId }, select: { id: true } })
  ).map((p) => p.id);

  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const completedTasks = await prisma.task.findMany({
    where: {
      projectId: { in: projectIds },
      status: "DONE",
      updatedAt: { gte: since },
    },
    select: { updatedAt: true },
  });

  // Bucket into week-start dates (Monday) in JS rather than in SQL —
  // keeps this portable and easy to read, and the dataset per org is
  // small enough that this isn't a performance concern.
  const buckets = new Map();
  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(since);
    weekStart.setDate(weekStart.getDate() + i * 7);
    buckets.set(weekStart.toISOString().slice(0, 10), 0);
  }

  completedTasks.forEach((t) => {
    const weeksSinceStart = Math.floor((t.updatedAt - since) / (7 * 24 * 60 * 60 * 1000));
    const bucketDate = new Date(since);
    bucketDate.setDate(bucketDate.getDate() + weeksSinceStart * 7);
    const key = bucketDate.toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, buckets.get(key) + 1);
    }
  });

  return [...buckets.entries()].map(([weekStart, count]) => ({ weekStart, count }));
}

module.exports = {
  getOrganizationOverview,
  getTasksByPriority,
  getTasksByStatus,
  getTeamWorkload,
  getProjectProgress,
  getTasksCompletedPerWeek,
};