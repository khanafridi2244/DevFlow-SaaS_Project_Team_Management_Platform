import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { getOrganizationActivity } from "@/lib/activities";

const ACTION_LABELS: Record<string, string> = {
  COMMENT_ADDED: "commented on",
  ATTACHMENT_UPLOADED: "uploaded a file to",
};

export default function ActivityPage() {
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);

  const { data: activities } = useQuery({
    queryKey: ["activity", activeOrgId],
    queryFn: () => getOrganizationActivity(activeOrgId!),
    enabled: !!activeOrgId,
  });

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-paper">Activity</h1>
      <p className="mt-1 text-sm text-paper/50">Everything happening across your workspace.</p>

      <div className="mt-6 space-y-1">
        {activities?.length === 0 && <p className="text-sm text-paper/30">No activity yet.</p>}
        {activities?.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 rounded px-2 py-2 hover:bg-white/[0.02]">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signal/20 font-mono text-[9px] text-signal">
              {activity.actor.firstName[0]}
              {activity.actor.lastName[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm text-paper/80">
                <span className="font-medium text-paper">
                  {activity.actor.firstName} {activity.actor.lastName}
                </span>{" "}
                {ACTION_LABELS[activity.action] ?? activity.action.toLowerCase().replace(/_/g, " ")}{" "}
                {activity.metadata?.taskTitle && (
                  <span className="text-paper/60">"{activity.metadata.taskTitle}"</span>
                )}
              </p>
              <p className="font-mono text-[10px] text-paper/30">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}