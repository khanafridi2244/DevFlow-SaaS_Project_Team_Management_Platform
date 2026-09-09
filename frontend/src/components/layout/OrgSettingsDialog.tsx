import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { updateOrganization, deleteOrganization } from "@/lib/workspace";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface OrgSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Only OWNER can delete a workspace on the backend (requireRole("OWNER")
// on DELETE /organizations/:id) — ADMIN can rename it (requireRole("ADMIN")
// on the PATCH route). This dialog mirrors that exact split, so an
// ADMIN sees the rename field but never sees a delete option they'd
// just get a 403 for anyway.
export function OrgSettingsDialog({ open, onOpenChange }: OrgSettingsDialogProps) {
  const { organizations, activeOrgId, setActiveOrgId } = useWorkspaceStore();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const activeOrg = organizations.find((o) => o.id === activeOrgId);
  const isOwner = activeOrg?.myRole === "OWNER";
  const canRename = activeOrg?.myRole === "OWNER" || activeOrg?.myRole === "ADMIN";

  const renameMutation = useMutation({
    mutationFn: () => updateOrganization(activeOrgId!, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteOrganization(activeOrgId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      const remaining = organizations.filter((o) => o.id !== activeOrgId);
      if (remaining.length > 0) setActiveOrgId(remaining[0].id);
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Workspace settings">
      <div className="space-y-6">
        {canRename ? (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-paper/80">Workspace name</label>
            <div className="flex gap-2">
              <Input
                value={name || activeOrg?.name || ""}
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
        ) : (
          <p className="text-sm text-paper/40">Only workspace admins can rename this workspace.</p>
        )}

        {isOwner && (
          <div className="border-t border-line pt-4">
            {confirmingDelete ? (
              <div className="space-y-2">
                <p className="text-xs text-red-400">
                  This deletes the entire workspace — all projects, tasks, and data inside it.
                  This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => deleteMutation.mutate()}
                    isLoading={deleteMutation.isPending}
                  >
                    Delete workspace
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="flex items-center gap-1.5 text-xs text-paper/40 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete workspace
              </button>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}