import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjectDetail } from "@/lib/projects";
import { updateTask } from "@/lib/tasks";
import { cn } from "@/lib/utils";

interface AssigneePickerProps {
  taskId: string;
  projectId: string;
  currentAssigneeId: string | null;
}

// Only lists people who are actually project members — matches the
// backend's own rule exactly (updateTask throws a 400 if you try to
// assign someone who isn't a project member), so the picker can never
// offer a choice the API would reject.
export function AssigneePicker({ taskId, projectId, currentAssigneeId }: AssigneePickerProps) {
  const queryClient = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ["project-detail", projectId],
    queryFn: () => getProjectDetail(projectId),
  });

  const mutation = useMutation({
    mutationFn: (assigneeId: string | null) => updateTask(taskId, { assigneeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-paper/40">Assignee</label>
      <select
        value={currentAssigneeId ?? ""}
        onChange={(e) => mutation.mutate(e.target.value || null)}
        className={cn(
          "h-9 w-full rounded border border-line bg-white/[0.03] px-2 text-sm text-paper focus:border-signal focus:outline-none",
          mutation.isPending && "opacity-50"
        )}
      >
        <option value="">Unassigned</option>
        {project?.members.map((m) => (
          <option key={m.user.id} value={m.user.id}>
            {m.user.firstName} {m.user.lastName}
          </option>
        ))}
      </select>
    </div>
  );
}