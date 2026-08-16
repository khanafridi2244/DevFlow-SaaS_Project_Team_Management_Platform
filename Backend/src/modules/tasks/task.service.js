const { prisma } = require("../../config/prisma");
const { ApiError } = require("../../utils/apiError");
const { assertOrgMembership } = require("../projects/project.service");

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
};

const TASK_INCLUDE = {
  assignee: { select: USER_SELECT },
  createdBy: { select: USER_SELECT },
  labels: true,
  _count: { select: { comments: true, attachments: true } },
};

// Tasks inherit permissions from their project's organization — this
// walks task -> project -> org membership, the same chain every
// task action needs to verify before doing anything.
async function getProjectAndAssertMembership(projectId, userId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw ApiError.notFound("Project not found");
  }
  await assertOrgMembership(project.organizationId, userId);
  return project;
}

async function getTaskWithProject(taskId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });
  if (!task) {
    throw ApiError.notFound("Task not found");
  }
  return task;
}

async function createTask(userId, { projectId, title, description, priority, assigneeId, dueDate, labels }) {
  await getProjectAndAssertMembership(projectId, userId);

  if (assigneeId) {
    const isProjectMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: assigneeId } },
    });
    if (!isProjectMember) {
      throw ApiError.badRequest("Assignee must be a member of this project");
    }
  }

  const task = await prisma.task.create({
    data: {
      projectId,
      title,
      description,
      priority: priority || "MEDIUM",
      assigneeId: assigneeId || null,
      createdById: userId,
      dueDate: dueDate ? new Date(dueDate) : null,
      labels: labels?.length
        ? { create: labels.map((name) => ({ name })) }
        : undefined,
    },
    include: TASK_INCLUDE,
  });

  return task;
}

async function listTasks(userId, { projectId, status, priority, assigneeId, label, search }) {
  await getProjectAndAssertMembership(projectId, userId);

  const where = { projectId };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = assigneeId;
  if (label) where.labels = { some: { name: label } };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  return prisma.task.findMany({
    where,
    include: TASK_INCLUDE,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

async function getTaskById(taskId, userId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { ...TASK_INCLUDE, project: { select: { id: true, name: true, organizationId: true } } },
  });
  if (!task) {
    throw ApiError.notFound("Task not found");
  }
  await assertOrgMembership(task.project.organizationId, userId);
  return task;
}

async function updateTask(taskId, userId, data) {
  const task = await getTaskWithProject(taskId);
  await assertOrgMembership(task.project.organizationId, userId);

  if (data.assigneeId) {
    const isProjectMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: data.assigneeId } },
    });
    if (!isProjectMember) {
      throw ApiError.badRequest("Assignee must be a member of this project");
    }
  }

  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId; // supports null (unassign)
  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  }

  return prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: TASK_INCLUDE,
  });
}

// Purpose-built, lightweight action for the Kanban board drag-and-drop
async function updateTaskStatus(taskId, userId, status) {
  const task = await getTaskWithProject(taskId);
  await assertOrgMembership(task.project.organizationId, userId);

  return prisma.task.update({
    where: { id: taskId },
    data: { status },
    include: TASK_INCLUDE,
  });
}

async function deleteTask(taskId, userId) {
  const task = await getTaskWithProject(taskId);
  const membership = await assertOrgMembership(task.project.organizationId, userId);

  const canDelete =
    task.createdById === userId || ["ADMIN", "OWNER", "MANAGER"].includes(membership.role);

  if (!canDelete) {
    throw ApiError.forbidden("Only the task creator or a manager/admin can delete this task");
  }

  await prisma.task.delete({ where: { id: taskId } });
}

async function addLabel(taskId, userId, { name, color }) {
  const task = await getTaskWithProject(taskId);
  await assertOrgMembership(task.project.organizationId, userId);

  return prisma.taskLabel.create({
    data: { taskId, name, color: color || undefined },
  });
}

async function removeLabel(taskId, labelId, userId) {
  const task = await getTaskWithProject(taskId);
  await assertOrgMembership(task.project.organizationId, userId);

  const label = await prisma.taskLabel.findUnique({ where: { id: labelId } });
  if (!label || label.taskId !== taskId) {
    throw ApiError.notFound("Label not found on this task");
  }

  await prisma.taskLabel.delete({ where: { id: labelId } });
}

module.exports = {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addLabel,
  removeLabel,
};