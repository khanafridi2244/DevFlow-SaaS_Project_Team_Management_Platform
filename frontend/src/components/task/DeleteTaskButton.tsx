import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { deleteTask } from "@/lib/tasks";
import { Button } from "@/components/ui/Button";

interface DeleteTaskButtonProps {
  taskId: string;
  projectId: string;
  onDeleted: () => void;
}

export function DeleteTaskButton({ taskId, projectId, onDeleted }: DeleteTaskButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      onDeleted();
    },
  });

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-paper/50">Delete this task?</span>
        <Button variant="danger" size="sm" onClick={() => mutation.mutate()} isLoading={mutation.isPending}>
          Confirm
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-xs text-paper/40 hover:text-red-400"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Delete task
    </button>
  );
}