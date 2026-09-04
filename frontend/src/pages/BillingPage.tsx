import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { getSubscription, changePlan, Plan } from "@/lib/subscription";
import { listProjects } from "@/lib/projects";
import { getOrganizationDetail } from "@/lib/members";
import { PlanCard } from "@/components/billing/PlanCard";
import { UsageBar } from "@/components/billing/UsageBar";

const PLANS: Plan[] = ["FREE", "PRO", "ENTERPRISE"];

export default function BillingPage() {
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const organizations = useWorkspaceStore((s) => s.organizations);
  const queryClient = useQueryClient();

  const myRole = organizations.find((o) => o.id === activeOrgId)?.myRole;
  const canUpgrade = myRole === "OWNER"; // matches backend's requireRole("OWNER") on PATCH /subscriptions

  const { data: sub } = useQuery({
    queryKey: ["subscription", activeOrgId],
    queryFn: () => getSubscription(activeOrgId!),
    enabled: !!activeOrgId,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects", activeOrgId],
    queryFn: () => listProjects(activeOrgId!),
    enabled: !!activeOrgId,
  });

  const { data: org } = useQuery({
    queryKey: ["organization", activeOrgId],
    queryFn: () => getOrganizationDetail(activeOrgId!),
    enabled: !!activeOrgId,
  });

  const changePlanMutation = useMutation({
    mutationFn: (plan: Plan) => changePlan(activeOrgId!, plan),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscription", activeOrgId] }),
  });

  const totalTasks = projects?.reduce((sum, p) => sum + (p.taskCount ?? 0), 0) ?? 0;

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-paper">Billing</h1>
      <p className="mt-1 text-sm text-paper/50">Manage your plan and usage.</p>

      {sub && (
        <div className="mt-6 max-w-sm space-y-4 rounded-lg border border-line bg-white/[0.02] p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-paper/40">Usage</h2>
          <UsageBar label="Projects" current={projects?.length ?? 0} max={sub.limits.maxProjects} />
          <UsageBar label="Members" current={org?.members.length ?? 0} max={sub.limits.maxMembers} />
          <UsageBar label="Tasks" current={totalTasks} max={sub.limits.maxTasks} />
        </div>
      )}

      {!canUpgrade && (
        <p className="mt-4 text-xs text-paper/40">
          Only the workspace owner can change the plan.
        </p>
      )}

      <div className="mt-6 grid grid-cols-3 gap-4">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan}
            plan={plan}
            isCurrent={sub?.subscription.plan === plan}
            canUpgrade={canUpgrade}
            onSelect={() => changePlanMutation.mutate(plan)}
            isLoading={changePlanMutation.isPending && changePlanMutation.variables === plan}
          />
        ))}
      </div>
    </div>
  );
}