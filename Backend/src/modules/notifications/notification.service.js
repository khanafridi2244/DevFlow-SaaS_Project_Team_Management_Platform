const { prisma } = require("../../config/prisma");
const { emitToUser } = require("../../config/socket");

async function createNotification({ organizationId, userId, type, message, metadata = null }) {
  try {
    const notification = await prisma.notification.create({
      data: { organizationId, userId, type, message, metadata },
    });

    // Push it live to any open tab/device the user has connected.
    // If they're offline, this silently does nothing — they'll still
    // see it in their notification list next time they load the app,
    // since it's already saved in the DB above.
    emitToUser(userId, "notification:new", notification);

    return notification;
  } catch (err) {
    console.error("Failed to create notification:", err);
    return null;
  }
}

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
    return null;
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