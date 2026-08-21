const { prisma } = require("../../config/prisma");
const { ApiError } = require("../../utils/apiError");
const { assertCanCreateProject } = require("../subscriptions/subscription.service");

const PROJECT_MEMBER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
};

// Every project action needs to confirm the requester actually belongs
// to the project's parent organization — projects don't have their own
// separate permission system, they inherit from org membership.
async function assertOrgMembership(organizationId, userId) {
  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  });
  if (!membership) {
    throw ApiError.forbidden("You are not a member of this organization");
  }
  return membership;
}

async function createProject(userId, { organizationId, name, description, startDate, deadline }) {
  await assertOrgMembership(organizationId, userId);
  await assertCanCreateProject(organizationId);
  
  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        organizationId,
        name,
        description,
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        createdById: userId,
      },
    });

    // Creator is automatically added as a project member
    await tx.projectMember.create({
      data: { projectId: created.id, userId },
    });

    return created;
  });

  return project;
}

async function listProjects(userId, { organizationId, status }) {
  await assertOrgMembership(organizationId, userId);

  const where = { organizationId };
  if (status) where.status = status;

  const projects = await prisma.project.findMany({
    where,
    include: {
      _count: { select: { tasks: true, members: true } },
      createdBy: { select: PROJECT_MEMBER_SELECT },
    },
    orderBy: { createdAt: "desc" },
  });

  return projects.map((p) => ({
    ...p,
    taskCount: p._count.tasks,
    memberCount: p._count.members,
  }));
}

async function getProjectById(projectId, userId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: { include: { user: { select: PROJECT_MEMBER_SELECT } } },
      createdBy: { select: PROJECT_MEMBER_SELECT },
      _count: { select: { tasks: true } },
    },
  });

  if (!project) {
    throw ApiError.notFound("Project not found");
  }

  await assertOrgMembership(project.organizationId, userId);

  return project;
}

async function updateProject(projectId, userId, data) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw ApiError.notFound("Project not found");
  }
  await assertOrgMembership(project.organizationId, userId);

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
  if (data.deadline !== undefined) updateData.deadline = new Date(data.deadline);

  return prisma.project.update({ where: { id: projectId }, data: updateData });
}

async function deleteProject(projectId, userId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw ApiError.notFound("Project not found");
  }

  const membership = await assertOrgMembership(project.organizationId, userId);

  // Only org-level ADMIN/OWNER, or the project's own creator, can delete it
  const canDelete =
    project.createdById === userId || ["ADMIN", "OWNER"].includes(membership.role);

  if (!canDelete) {
    throw ApiError.forbidden("Only the project creator or an org admin can delete this project");
  }

  await prisma.project.delete({ where: { id: projectId } });
}

async function addProjectMember(projectId, requestingUserId, targetUserId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw ApiError.notFound("Project not found");
  }
  await assertOrgMembership(project.organizationId, requestingUserId);

  // The person being added must also belong to the parent organization
  await assertOrgMembership(project.organizationId, targetUserId);

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: targetUserId } },
  });
  if (existing) {
    throw ApiError.conflict("This user is already a project member");
  }

  return prisma.projectMember.create({
    data: { projectId, userId: targetUserId },
    include: { user: { select: PROJECT_MEMBER_SELECT } },
  });
}

async function removeProjectMember(projectId, requestingUserId, targetUserId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw ApiError.notFound("Project not found");
  }
  await assertOrgMembership(project.organizationId, requestingUserId);

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: targetUserId } },
  });
  if (!membership) {
    throw ApiError.notFound("This user is not a project member");
  }

  await prisma.projectMember.delete({ where: { id: membership.id } });
}

module.exports = {
  assertOrgMembership,
  createProject,
  listProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
};