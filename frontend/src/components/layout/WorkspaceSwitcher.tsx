import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import { useState } from "react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrganization } from "@/lib/workspace";
import { cn } from "@/lib/utils";

export function WorkspaceSwitcher() {
  const { organizations, activeOrgId, setActiveOrgId } = useWorkspaceStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const queryClient = useQueryClient();

  const activeOrg = organizations.find((o) => o.id === activeOrgId);

  const createMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setActiveOrgId(org.id);
      setIsCreating(false);
      setNewOrgName("");
    },
  });

  return (
    <div className="border-b border-line p-2">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm text-paper hover:bg-white/5">
            <span className="truncate font-medium">{activeOrg?.name ?? "Select workspace"}</span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-paper/40" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={4}
            className="z-50 w-56 rounded border border-line bg-ink p-1 shadow-lg"
          >
            {organizations.map((org) => (
              <DropdownMenu.Item
                key={org.id}
                onSelect={() => setActiveOrgId(org.id)}
                className="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-sm text-paper outline-none hover:bg-white/5"
              >
                <span className="truncate">{org.name}</span>
                {org.id === activeOrgId && <Check className="h-3.5 w-3.5 text-signal" />}
              </DropdownMenu.Item>
            ))}

            <DropdownMenu.Separator className="my-1 h-px bg-line" />

            {isCreating ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newOrgName.trim()) createMutation.mutate(newOrgName.trim());
                }}
                className="p-1"
              >
                <input
                  autoFocus
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Workspace name"
                  className="w-full rounded border border-line bg-white/5 px-2 py-1 text-sm text-paper outline-none focus:border-signal"
                />
              </form>
            ) : (
              <DropdownMenu.Item
                onSelect={(e) => {
                  e.preventDefault();
                  setIsCreating(true);
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-paper/70 outline-none hover:bg-white/5"
                )}
              >
                <Plus className="h-3.5 w-3.5" />
                New workspace
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}