import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listNotifications, Notification } from "@/lib/notifications";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";

export function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications(),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const socket = connectSocket();

    // Matches exactly the event name the backend emits from
    // notification.service.js: emitToUser(userId, "notification:new", ...)
    function handleNewNotification(notification: Notification) {
      queryClient.setQueryData<Notification[]>(["notifications"], (old = []) => [
        notification,
        ...old,
      ]);
    }

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
      disconnectSocket();
    };
  }, [user, queryClient]);

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return { notifications: notifications ?? [], unreadCount };
}