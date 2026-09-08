import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, UserPlus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProjectDetail, updateProject, deleteProject, addProjectMember, removeProjectMember } from "@/lib/projects";
import { getOrganizationDetail } from "@/lib/members";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ProjectSettingsDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectSettingsDialog({ projectId, open, onOpenChange }: ProjectSettingsDialogProps) {
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [name, setName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const { data: project } = useQuery({
    queryKey: ["project-detail", projectId],
    queryFn: () => getProjectDetail(projectId),
    enabled: open,
  });

  // Full org member list — used to pick who to ADD to this project.
  // People already on the project are filtered out of the dropdown
  // below so you can't try to add someone twice.
  const { data: org } = useQuery({
    queryKey: ["organization", activeOrgId],
    queryFn: () => getOrganizationDetail(activeOrgId!),
    enabled: open && !!activeOrgId,
  });

  const renameMutation = useMutation({
    mutationFn: () => updateProject(projectId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-detail", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects", activeOrgId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", activeOrgId] });
      navigate("/projects");
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: (userId: string) => addProjectMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-detail", projectId] });
      setSelectedUserId("");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeProjectMember(projectId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-detail", projectId] }),
  });

  const projectMemberIds = new Set(project?.members.map((m) => m.user.id));
  const availableOrgMembers = org?.members.filter((m) => !projectMemberIds.has(m.user.id)) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Project settings">
      <div className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-paper/80">Project name</label>
          <div className="flex gap-2">
            <Input
              value={name || project?.name || ""}
              onChange={(e) => setName(e.target.value)}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={() => renameMutation.mutate()}
              isLoading={renameMutation.isPending}
              disabled={!name.trim()}
            >
              Save
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-paper/40">Project members</h3>
          <div className="mt-2 space-y-1.5">
            {project?.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded border border-line px-3 py-2">
                <span className="text-sm text-paper">
                  {m.user.firstName} {m.user.lastName}
                </span>
                <button
                  onClick={() => removeMemberMutation.mutate(m.user.id)}
                  className="text-paper/30 hover:text-red-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {availableOrgMembers.length > 0 && (
            <div className="mt-2 flex gap-2">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="h-9 flex-1 rounded border border-line bg-white/[0.03] px-2 text-sm text-paper focus:border-signal focus:outline-none"
              >
                <option value="">Add a member...</option>
                {availableOrgMembers.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.firstName} {m.user.lastName}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={() => selectedUserId && addMemberMutation.mutate(selectedUserId)}
                isLoading={addMemberMutation.isPending}
                disabled={!selectedUserId}
              >
                <UserPlus className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <div className="border-t border-line pt-4">
          {confirmingDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-paper/50">Delete this project and all its tasks?</span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteMutation.mutate()}
                isLoading={deleteMutation.isPending}
              >
                Confirm
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-1.5 text-xs text-paper/40 hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete project
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
}