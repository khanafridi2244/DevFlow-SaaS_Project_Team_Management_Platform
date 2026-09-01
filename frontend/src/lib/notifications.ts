import { api, ApiResponse } from "./api";

export interface Notification {
  id: string;
  organizationId: string;
  userId: string;
  type: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export async function listNotifications(unreadOnly = false) {
  const res = await api.get<ApiResponse<{ notifications: Notification[] }>>("/notifications", {
    params: { unreadOnly },
  });
  return res.data.data.notifications;
}

export async function markAsRead(notificationId: string) {
  await api.patch(`/notifications/${notificationId}/read`);
}

export async function markAllAsRead() {
  await api.patch("/notifications/read-all");
}