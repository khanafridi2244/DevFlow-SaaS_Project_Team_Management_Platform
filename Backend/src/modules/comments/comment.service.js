const { prisma } = require("../../config/prisma");
const { ApiError } = require("../../utils/apiError");
const { assertOrgMembership } = require("../projects/project.service");
const { logActivity } = require("../activities/activity.service");
const { notifyMentionedUsers, notifyTaskParticipants } = require("../notifications/notification.service");

const AUTHOR_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
};

// Extracts @mentions like "@ali" or "@Sikandar_Ali" from a comment body.
// This is intentionally simple pattern matching, not a full parser —
// good enough to detect mention *intent* so we can notify people.
function extractMentionHandles(text) {
  const matches = text.match(/@([a-zA-Z0-9_.]+)/g) || [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

async function getTaskWithOrg(taskId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });
  if (!task) {
    throw ApiError.notFound("Task not found");
  }
  return task;
}

async function createComment(userId, { taskId, body }) {
  const task = await getTaskWithOrg(taskId);
  await assertOrgMembership(task.project.organizationId, userId);

  const comment = await prisma.comment.create({
    data: { taskId, authorId: userId, body },
    include: { author: { select: AUTHOR_SELECT } },
  });

  await logActivity({
    organizationId: task.project.organizationId,
    projectId: task.projectId,
    actorId: userId,
    action: "COMMENT_ADDED",
    metadata: { taskId, taskTitle: task.title, commentId: comment.id },
  });

  // Notify assignee/creator (if they didn't write the comment themselves),
  // plus anyone @mentioned by name in the comment body.
  await notifyTaskParticipants({
    task,
    excludeUserId: userId,
    type: "COMMENT_ADDED",
    message: `${comment.author.firstName} commented on "${task.title}"`,
  });

  const mentionHandles = extractMentionHandles(body);
  if (mentionHandles.length > 0) {
    await notifyMentionedUsers({
      organizationId: task.project.organizationId,
      handles: mentionHandles,
      excludeUserId: userId,
      message: `${comment.author.firstName} mentioned you in a comment on "${task.title}"`,
      metadata: { taskId, commentId: comment.id },
    });
  }

  return comment;
}

async function listComments(userId, taskId) {
  const task = await getTaskWithOrg(taskId);
  await assertOrgMembership(task.project.organizationId, userId);

  return prisma.comment.findMany({
    where: { taskId },
    include: { author: { select: AUTHOR_SELECT } },
    orderBy: { createdAt: "asc" },
  });
}

async function updateComment(commentId, userId, body) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) {
    throw ApiError.notFound("Comment not found");
  }

  // Only the author can edit their own comment — no admin override here,
  // editing someone else's words is a different trust boundary than
  // deleting them.
  if (comment.authorId !== userId) {
    throw ApiError.forbidden("You can only edit your own comments");
  }

  return prisma.comment.update({
    where: { id: commentId },
    data: { body },
    include: { author: { select: AUTHOR_SELECT } },
  });
}

async function deleteComment(commentId, userId) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { task: { include: { project: true } } },
  });
  if (!comment) {
    throw ApiError.notFound("Comment not found");
  }

  const membership = await assertOrgMembership(comment.task.project.organizationId, userId);

  const canDelete = comment.authorId === userId || ["ADMIN", "OWNER"].includes(membership.role);
  if (!canDelete) {
    throw ApiError.forbidden("Only the comment author or an org admin can delete this comment");
  }

  await prisma.comment.delete({ where: { id: commentId } });
}

module.exports = {
  createComment,
  listComments,
  updateComment,
  deleteComment,
};