import { motion } from "framer-motion";
import { MessageSquare, Paperclip } from "lucide-react";
import { Task } from "@/lib/tasks";
import { cn } from "@/lib/utils";

const RAIL_COLORS: Record<Task["status"], string> = {
  TODO: "bg-status-todo",
  IN_PROGRESS: "bg-status-in-progress",
  IN_REVIEW: "bg-status-in-review",
  DONE: "bg-status-done",
};

const PRIORITY_DOT: Record<Task["priority"], string> = {
  LOW: "bg-paper/20",
  MEDIUM: "bg-signal/60",
  HIGH: "bg-warn",
  URGENT: "bg-red-500",
};

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

// This is the signature element from the design plan: a colored rail
// on the card's left edge instead of a status badge, reading like a
// git-diff gutter or CI status strip. The rail color transitions
// smoothly (via layout + the color change itself) when status changes,
// rather than the whole card re-styling.
export function TaskCard({ task, isDragging, onDragStart }: TaskCardProps) {
  return (
    <motion.div
      layout
      layoutId={task.id}
      draggable
      onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, task.id)}
      className={cn(
        "group relative cursor-grab overflow-hidden rounded border border-line bg-white/[0.02] pl-3 pr-3 py-2.5 active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <motion.div
        layout
        className={cn("absolute left-0 top-0 h-full w-[3px] transition-colors", RAIL_COLORS[task.status])}
      />

      <p className="text-sm text-paper">{task.title}</p>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT[task.priority])} />
          {task.labels.slice(0, 2).map((label) => (
            <span
              key={label.id}
              className="rounded px-1.5 py-0.5 font-mono text-[10px] text-paper/60"
              style={{ backgroundColor: `${label.color}22` }}
            >
              {label.name}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 text-paper/30">
          {task._count.comments > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <MessageSquare className="h-3 w-3" /> {task._count.comments}
            </span>
          )}
          {task._count.attachments > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <Paperclip className="h-3 w-3" /> {task._count.attachments}
            </span>
          )}
        </div>
      </div>

      {task.assignee && (
        <div
          className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-signal/20 font-mono text-[9px] text-signal"
          title={`${task.assignee.firstName} ${task.assignee.lastName}`}
        >
          {task.assignee.firstName[0]}
          {task.assignee.lastName[0]}
        </div>
      )}
    </motion.div>
  );
}