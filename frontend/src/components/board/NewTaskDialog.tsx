import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask, TaskPriority } from "@/lib/tasks";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

interface NewTaskDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTaskDialog({ projectId, open, onOpenChange }: NewTaskDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");

  const mutation = useMutation({
    mutationFn: () => createTask({ projectId, title: title.trim(), priority }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      onOpenChange(false);
      setTitle("");
      setPriority("MEDIUM");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="New task">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) mutation.mutate();
        }}
        className="space-y-4"
      >
        <Input
          id="task-title"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-paper/80">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="h-10 w-full rounded border border-line bg-white/[0.03] px-3 text-sm text-paper focus:border-signal focus:outline-none"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {mutation.isError && (
          <p className="rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {(mutation.error as any)?.response?.data?.message ?? "Failed to create task"}
          </p>
        )}

        <Button type="submit" className="w-full" isLoading={mutation.isPending}>
          Create task
        </Button>
      </form>
    </Dialog>
  );
}