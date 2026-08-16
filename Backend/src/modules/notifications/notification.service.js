const { prisma } = require("../../config/prisma");

// Fire-and-forget helper: creates a notification row for a single user.
// Deliberately swallows errors rather than throwing — a failed
// notification should never block or fail the action that triggered it
// (e.g. a comment should still save even if notification insert fails).
async function createNotification({ organizationId, userId, type, message, metadata = null }) {
  try {
    return await prisma.notification.create({
      data: { organizationId, userId, type, message, metadata },
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
    return null;
  }
}

// Notifies a task's assignee and creator when something happens on the
// task (e.g. a new comment) — skips the person who triggered the event
// and de-duplicates if assignee and creator are the same person.
async function notifyTaskParticipants({ task, excludeUserId, type, message, metadata = null }) {
  const recipientIds = new Set(
    [task.assigneeId, task.createdById].filter((id) => id && id !== excludeUserId)
  );

  await Promise.all(
    [...recipientIds].map((userId) =>
      createNotification({
        organizationId: task.project.organizationId,
        userId,
        type,
        message,
        metadata: { taskId: task.id, ...metadata },
      })
    )
  );
}

// Resolves @handles to real users within the organization (matches on
// first name, case-insensitively, as a simple v1 approach) and notifies
// each one — used for @mentions in comments.
async function notifyMentionedUsers({ organizationId, handles, excludeUserId, message, metadata = null }) {
  if (handles.length === 0) return;

  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: { user: { select: { id: true, firstName: true } } },
  });

  const matchedUserIds = members
    .filter(
      (m) =>
        handles.includes(m.user.firstName.toLowerCase()) && m.userId !== excludeUserId
    )
    .map((m) => m.userId);

  await Promise.all(
    matchedUserIds.map((userId) =>
      createNotification({ organizationId, userId, type: "MENTION", message, metadata })
    )
  );
}

async function listMyNotifications(userId, { unreadOnly = false, limit = 50 } = {}) {
  const where = { userId };
  if (unreadOnly) where.isRead = false;

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

async function markAsRead(notificationId, userId) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.userId !== userId) {
    return null; // silently no-op — reading someone else's notification isn't a real error case
  }
  return prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
}

async function markAllAsRead(userId) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

module.exports = {
  createNotification,
  notifyTaskParticipants,
  notifyMentionedUsers,
  listMyNotifications,
  markAsRead,
  markAllAsRead,
};