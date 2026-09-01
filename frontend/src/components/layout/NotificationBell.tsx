import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "@/hooks/useNotifications";
import { markAsRead, markAllAsRead } from "@/lib/notifications";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { notifications, unreadCount } = useNotifications();
  const queryClient = useQueryClient();

  const markOneRead = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="relative flex h-8 w-8 items-center justify-center rounded text-paper/60 hover:bg-white/5 hover:text-paper">
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-signal font-mono text-[9px] text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 rounded border border-line bg-ink shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="text-xs font-medium text-paper/60">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-[11px] text-signal hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-paper/30">You're all caught up.</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.isRead && markOneRead.mutate(n.id)}
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 border-b border-line px-3 py-2.5 text-left last:border-0 hover:bg-white/5",
                  !n.isRead && "bg-signal-muted/30"
                )}
              >
                <div className="flex w-full items-center gap-2">
                  {!n.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />}
                  <span className="flex-1 text-sm text-paper">{n.message}</span>
                </div>
                <span className="font-mono text-[10px] text-paper/30">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </span>
              </button>
            ))}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}