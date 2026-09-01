import { useQuery } from "@tanstack/react-query";
import { getTask } from "@/lib/tasks";
import { Dialog } from "@/components/ui/Dialog";
import { CommentThread } from "./CommentThread";
import { AttachmentList } from "./AttachmentList";
import { cn } from "@/lib/utils";

const RAIL_COLORS: Record<string, string> = {
  TODO: "bg-status-todo",
  IN_PROGRESS: "bg-status-in-progress",
  IN_REVIEW: "bg-status-in-review",
  DONE: "bg-status-done",
};

interface TaskDetailModalProps {
  taskId: string | null;
  onClose: () => void;
}

export function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
  const { data: task } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTask(taskId!),
    enabled: !!taskId,
  });

  return (
    <Dialog open={!!taskId} onOpenChange={(open) => !open && onClose()} title={task?.title ?? "Loading..."}>
      {task && (
        <div className="max-h-[70vh] space-y-6 overflow-y-auto">
          <div className="flex items-center gap-3">
            <span className={cn("h-2 w-2 rounded-full", RAIL_COLORS[task.status])} />
            <span className="font-mono text-xs text-paper/50">{task.status.replace("_", " ")}</span>
            <span className="text-paper/20">·</span>
            <span className="font-mono text-xs text-paper/50">{task.priority}</span>
          </div>

          {task.description && <p className="text-sm text-paper/70">{task.description}</p>}

          <AttachmentList taskId={task.id} />
          <CommentThread taskId={task.id} />
        </div>
      )}
    </Dialog>
  );
}