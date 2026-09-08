import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Task, TaskPriority, updateTask } from "@/lib/tasks";

const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function EditableTaskFields({ task }: { task: Task }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");

  const mutation = useMutation({
    mutationFn: (payload: Partial<{ title: string; description: string; priority: TaskPriority }>) =>
      updateTask(task.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", task.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks", task.projectId] });
    },
  });

  // Saves on blur, not on every keystroke — avoids firing a PATCH
  // request for every single character typed.
  function handleTitleBlur() {
    if (title.trim() && title !== task.title) mutation.mutate({ title: title.trim() });
  }

  function handleDescriptionBlur() {
    if (description !== (task.description ?? "")) mutation.mutate({ description });
  }

  return (
    <div className="space-y-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-paper hover:border-line focus:border-signal focus:bg-white/[0.03] focus:outline-none"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={handleDescriptionBlur}
        placeholder="Add a description..."
        rows={2}
        className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-paper/70 placeholder:text-paper/30 hover:border-line focus:border-signal focus:bg-white/[0.03] focus:outline-none"
      />

      <div className="flex items-center gap-2">
        <label className="text-xs font-medium uppercase tracking-wide text-paper/40">Priority</label>
        <select
          value={task.priority}
          onChange={(e) => mutation.mutate({ priority: e.target.value as TaskPriority })}
          className="h-8 rounded border border-line bg-white/[0.03] px-2 text-xs text-paper focus:border-signal focus:outline-none"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}