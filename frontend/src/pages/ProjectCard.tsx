import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<Project["status"], string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const STATUS_STYLES: Record<Project["status"], string> = {
  PLANNED: "bg-white/5 text-paper/60",
  IN_PROGRESS: "bg-signal-muted text-signal",
  ON_HOLD: "bg-warn-muted text-warn",
  COMPLETED: "bg-done-muted text-done",
  ARCHIVED: "bg-white/5 text-paper/30",
};

export function ProjectCard({ project, delay = 0 }: { project: Project; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay }}>
      <Link
        to={`/projects/${project.id}`}
        className="block rounded-lg border border-line bg-white/[0.02] p-4 transition-colors hover:border-signal/40 hover:bg-white/[0.04]"
      >
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-paper">{project.name}</h3>
          <span className={cn("rounded px-2 py-0.5 text-xs", STATUS_STYLES[project.status])}>
            {STATUS_LABELS[project.status]}
          </span>
        </div>
        {project.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-paper/50">{project.description}</p>
        )}
        <div className="mt-4 flex items-center gap-4 font-mono text-xs text-paper/40">
          <span>{project.taskCount ?? 0} tasks</span>
          <span>{project.memberCount ?? 0} members</span>
        </div>
      </Link>
    </motion.div>
  );
}