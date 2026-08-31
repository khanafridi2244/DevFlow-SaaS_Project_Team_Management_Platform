import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { searchTasks } from "@/lib/search";
import { TaskStatus, TaskPriority } from "@/lib/tasks";
import { cn } from "@/lib/utils";

const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const RAIL_COLORS: Record<TaskStatus, string> = {
  TODO: "bg-status-todo",
  IN_PROGRESS: "bg-status-in-progress",
  IN_REVIEW: "bg-status-in-review",
  DONE: "bg-status-done",
};

export default function SearchPage() {
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [priority, setPriority] = useState<TaskPriority | "">("");

  const { data: tasks, isFetching } = useQuery({
    queryKey: ["search", activeOrgId, search, status, priority],
    queryFn: () =>
      searchTasks({
        organizationId: activeOrgId!,
        search: search || undefined,
        status: status || undefined,
        priority: priority || undefined,
      }),
    enabled: !!activeOrgId,
  });

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-paper">Search</h1>
      <p className="mt-1 text-sm text-paper/50">Find tasks across every project in this workspace.</p>

      <div className="mt-6 flex items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-paper/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or description..."
            className="h-10 w-full rounded border border-line bg-white/[0.03] pl-9 pr-3 text-sm text-paper placeholder:text-paper/30 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus | "")}
          className="h-10 rounded border border-line bg-white/[0.03] px-3 text-sm text-paper focus:border-signal focus:outline-none"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority | "")}
          className="h-10 rounded border border-line bg-white/[0.03] px-3 text-sm text-paper focus:border-signal focus:outline-none"
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 space-y-1">
        {isFetching && <p className="text-sm text-paper/40">Searching...</p>}
        {!isFetching && tasks?.length === 0 && (
          <p className="text-sm text-paper/40">No tasks match your filters.</p>
        )}
        {tasks?.map((task) => (
          <Link
            key={task.id}
            to={`/projects/${task.projectId}`}
            className="flex items-center gap-3 rounded border border-line bg-white/[0.02] px-3 py-2.5 transition-colors hover:border-signal/40"
          >
            <span className={cn("h-2 w-2 shrink-0 rounded-full", RAIL_COLORS[task.status])} />
            <span className="flex-1 text-sm text-paper">{task.title}</span>
            <span className="font-mono text-xs text-paper/30">{task.priority}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}