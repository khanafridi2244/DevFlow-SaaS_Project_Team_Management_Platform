import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { getCalendarTasks } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";



const RAIL_COLORS: Record<string, string> = {
  TODO: "bg-status-todo",
  IN_PROGRESS: "bg-status-in-progress",
  IN_REVIEW: "bg-status-in-review",
  DONE: "bg-status-done",
};

export default function CalendarPage() {
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const [cursor, setCursor] = useState(new Date());

  const monthKey = format(cursor, "yyyy-MM");

  const { data: tasks } = useQuery({
    queryKey: ["calendar", activeOrgId, monthKey],
    queryFn: () => getCalendarTasks(activeOrgId!, monthKey),
    enabled: !!activeOrgId,
  });

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  // Pad the start so the grid aligns to the correct weekday column
  const leadingBlanks = Array.from({ length: getDay(monthStart) });

  function tasksOnDay(day: Date) {
    return (
      tasks?.filter((t) => t.dueDate && new Date(t.dueDate).toDateString() === day.toDateString()) ?? []
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-paper">Calendar</h1>
          <p className="mt-1 text-sm text-paper/50">Everything due, across every project.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[7rem] text-center font-mono text-sm text-paper/70">
            {format(cursor, "MMMM yyyy")}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-line bg-line">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-ink px-2 py-1.5 text-center font-mono text-[10px] text-paper/40">
            {d}
          </div>
        ))}

        {leadingBlanks.map((_, i) => (
          <div key={`blank-${i}`} className="min-h-[90px] bg-ink/50" />
        ))}

        {days.map((day) => {
          const dayTasks = tasksOnDay(day);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[90px] bg-ink p-1.5",
                !isSameMonth(day, cursor) && "opacity-40"
              )}
            >
              <span
                className={cn(
                  "font-mono text-xs",
                  isToday(day) ? "rounded bg-signal px-1 py-0.5 text-white" : "text-paper/50"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center gap-1 truncate">
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", RAIL_COLORS[task.status])} />
                    <span className="truncate text-[10px] text-paper/70">{task.title}</span>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-[10px] text-paper/30">+{dayTasks.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}