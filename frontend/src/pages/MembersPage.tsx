import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, X } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { getOrganizationDetail, inviteMember, updateMemberRole, removeMember, OrgRole } from "@/lib/members";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";

const ROLES: OrgRole[] = ["ADMIN", "MANAGER", "DEVELOPER", "VIEWER"];

const ROLE_RANK: Record<OrgRole, number> = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  DEVELOPER: 2,
  VIEWER: 1,
};

export default function MembersPage() {
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const organizations = useWorkspaceStore((s) => s.organizations);
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("DEVELOPER");
  const [error, setError] = useState("");

  const myRole = organizations.find((o) => o.id === activeOrgId)?.myRole;
  const canManage = myRole && ["OWNER", "ADMIN"].includes(myRole);

  const { data: org } = useQuery({
    queryKey: ["organization", activeOrgId],
    queryFn: () => getOrganizationDetail(activeOrgId!),
    enabled: !!activeOrgId,
  });

  const inviteMutation = useMutation({
    mutationFn: () => inviteMember(activeOrgId!, email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", activeOrgId] });
      setIsInviteOpen(false);
      setEmail("");
      setError("");
    },
    onError: (err: any) => setError(err.response?.data?.message ?? "Failed to invite member"),
  });

  const roleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: OrgRole }) =>
      updateMemberRole(activeOrgId!, memberId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organization", activeOrgId] }),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => removeMember(activeOrgId!, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organization", activeOrgId] }),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-paper">Members</h1>
          <p className="mt-1 text-sm text-paper/50">Who has access to {org?.name}.</p>
        </div>
        {canManage && (
          <Button onClick={() => setIsInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invite member
          </Button>
        )}
      </div>

      <div className="mt-6 divide-y divide-line rounded-lg border border-line">
        {org?.members.map((member) => (
          <div key={member.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-signal/20 font-mono text-xs text-signal">
              {member.user.firstName[0]}
              {member.user.lastName[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm text-paper">
                {member.user.firstName} {member.user.lastName}
              </p>
              <p className="text-xs text-paper/40">{member.user.email}</p>
            </div>

            {canManage && member.role !== "OWNER" ? (
              <select
                value={member.role}
                onChange={(e) => roleMutation.mutate({ memberId: member.id, role: e.target.value as OrgRole })}
                className="h-8 rounded border border-line bg-white/[0.03] px-2 text-xs text-paper focus:border-signal focus:outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            ) : (
              <span
                className={cn(
                  "rounded px-2 py-1 font-mono text-[10px]",
                  member.role === "OWNER" ? "bg-signal-muted text-signal" : "bg-white/5 text-paper/50"
                )}
              >
                {member.role}
              </span>
            )}

            {canManage && member.role !== "OWNER" && (
              <button
                onClick={() => removeMutation.mutate(member.id)}
                className="text-paper/30 hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen} title="Invite member">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            inviteMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            id="invite-email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="They must already have a DevFlow account"
            required
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-paper/80">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as OrgRole)}
              className="h-10 w-full rounded border border-line bg-white/[0.03] px-3 text-sm text-paper focus:border-signal focus:outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" isLoading={inviteMutation.isPending}>
            Send invite
          </Button>
        </form>
      </Dialog>
    </div>
  );
}