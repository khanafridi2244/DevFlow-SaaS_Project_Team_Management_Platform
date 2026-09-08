import { useQuery } from "@tanstack/react-query";
import { getTask } from "@/lib/tasks";
import { Dialog } from "@/components/ui/Dialog";
import { CommentThread } from "./CommentThread";
import { AttachmentList } from "./AttachmentList";
import { SummarizeButton } from "./SummarizeButton";
import { AssigneePicker } from "./AssigneePicker";
import { EditableTaskFields } from "./EditableTaskFields";
import { DeleteTaskButton } from "./DeleteTaskButton";
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
    <Dialog open={!!taskId} onOpenChange={(open) => !open && onClose()} title="Task details">
      {task && (
        <div className="max-h-[70vh] space-y-6 overflow-y-auto">
          <div className="flex items-center gap-3">
            <span className={cn("h-2 w-2 rounded-full", RAIL_COLORS[task.status])} />
            <span className="font-mono text-xs text-paper/50">{task.status.replace("_", " ")}</span>
          </div>

          <EditableTaskFields task={task} />

          <AssigneePicker taskId={task.id} projectId={task.projectId} currentAssigneeId={task.assignee?.id ?? null} />

          <AttachmentList taskId={task.id} />
          <CommentThread taskId={task.id} />
          <SummarizeButton taskId={task.id} />

          <div className="border-t border-line pt-4">
            <DeleteTaskButton taskId={task.id} projectId={task.projectId} onDeleted={onClose} />
          </div>
        </div>
      )}
    </Dialog>
  );
}