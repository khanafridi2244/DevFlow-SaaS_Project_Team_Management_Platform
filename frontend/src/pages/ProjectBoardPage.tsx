import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listTasks, updateTaskStatus, TaskStatus } from "@/lib/tasks";
import { getProject } from "@/lib/projects";
import { BoardColumn } from "@/components/board/BoardColumn";
import { TaskDetailModal } from "@/components/task/TaskDetailModal";

const COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

export default function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId!),
    enabled: !!projectId,
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => listTasks(projectId!),
    enabled: !!projectId,
  });

  const statusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      updateTaskStatus(taskId, status),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });
      const previous = queryClient.getQueryData(["tasks", projectId]);

      queryClient.setQueryData(["tasks", projectId], (old: any) =>
        old?.map((t: any) => (t.id === taskId ? { ...t, status } : t))
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["tasks", projectId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

  function handleDragStart(e: React.DragEvent, taskId: string) {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(status: TaskStatus) {
    if (draggedTaskId) {
      statusMutation.mutate({ taskId: draggedTaskId, status });
      setDraggedTaskId(null);
    }
  }

  return (
    <div className="flex h-full flex-col p-6">
      <h1 className="text-lg font-semibold text-paper">{project?.name ?? "Loading..."}</h1>
      <p className="mt-1 text-sm text-paper/50">{project?.description}</p>

      <div className="mt-6 flex flex-1 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={tasks?.filter((t) => t.status === status) ?? []}
            draggedTaskId={draggedTaskId}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onTaskClick={setSelectedTaskId}
          />
        ))}
      </div>

      <TaskDetailModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
    </div>
  );
}