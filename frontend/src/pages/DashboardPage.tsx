import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, Clock, AlertTriangle } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { getOverview, getTasksByPriority, getCompletedPerWeek } from "@/lib/analytics";
import { StatCard } from "@/components/dashboard/StatCard";
import { PriorityChart } from "@/components/dashboard/PriorityChart";
import { WeeklyTrendChart } from "@/components/dashboard/WeeklyTrendChart";

export default function DashboardPage() {
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);

  const { data: overview } = useQuery({
    queryKey: ["analytics", "overview", activeOrgId],
    queryFn: () => getOverview(activeOrgId!),
    enabled: !!activeOrgId, // don't fire until we actually have a workspace selected
  });

  const { data: priority } = useQuery({
    queryKey: ["analytics", "priority", activeOrgId],
    queryFn: () => getTasksByPriority(activeOrgId!),
    enabled: !!activeOrgId,
  });

  const { data: weeklyTrend } = useQuery({
    queryKey: ["analytics", "weekly", activeOrgId],
    queryFn: () => getCompletedPerWeek(activeOrgId!),
    enabled: !!activeOrgId,
  });

  if (!activeOrgId) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-paper/50">
        Create or select a workspace to get started.
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-paper">Dashboard</h1>
      <p className="mt-1 text-sm text-paper/50">An overview of what's happening across your workspace.</p>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <StatCard label="Total tasks" value={overview?.totalTasks ?? 0} icon={Circle} delay={0} />
        <StatCard
          label="Completed"
          value={overview?.completedTasks ?? 0}
          icon={CheckCircle2}
          accent="done"
          delay={0.05}
        />
        <StatCard
          label="In progress"
          value={overview?.inProgressTasks ?? 0}
          icon={Clock}
          accent="signal"
          delay={0.1}
        />
        <StatCard
          label="Overdue"
          value={overview?.overdueTasks ?? 0}
          icon={AlertTriangle}
          accent="warn"
          delay={0.15}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {priority && <PriorityChart data={priority} />}
        {weeklyTrend && <WeeklyTrendChart data={weeklyTrend} />}
      </div>
    </div>
  );
}