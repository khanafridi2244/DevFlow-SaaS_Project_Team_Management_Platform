import { Task, TaskStatus } from "@/lib/tasks";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";

const COLUMN_LABELS: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "Review",
  DONE: "Done",
};

const COLUMN_DOT: Record<TaskStatus, string> = {
  TODO: "bg-status-todo",
  IN_PROGRESS: "bg-status-in-progress",
  IN_REVIEW: "bg-status-in-review",
  DONE: "bg-status-done",
};

interface BoardColumnProps {
  status: TaskStatus;
  tasks: Task[];
  draggedTaskId: string | null;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDrop: (status: TaskStatus) => void;
  onTaskClick: (taskId: string) => void;
}

export function BoardColumn({
  status,
  tasks,
  draggedTaskId,
  onDragStart,
  onDrop,
  onTaskClick,
}: BoardColumnProps) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDrop(status)}
      className="flex w-72 shrink-0 flex-col rounded-lg bg-white/[0.015] p-2"
    >
      <div className="flex items-center gap-2 px-2 py-1.5">
        <span className={cn("h-1.5 w-1.5 rounded-full", COLUMN_DOT[status])} />
        <h3 className="font-mono text-xs font-medium text-paper/60">{COLUMN_LABELS[status]}</h3>
        <span className="ml-auto font-mono text-xs text-paper/30">{tasks.length}</span>
      </div>

      <div className="mt-1 flex flex-col gap-2 p-1">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isDragging={draggedTaskId === task.id}
            onDragStart={onDragStart}
            onClick={() => onTaskClick(task.id)}
          />
        ))}
      </div>
    </div>
  );
}