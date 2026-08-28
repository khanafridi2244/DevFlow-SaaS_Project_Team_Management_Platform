import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: "signal" | "done" | "warn" | "default";
  delay?: number;
}

const accentStyles = {
  signal: "text-signal",
  done: "text-done",
  warn: "text-warn",
  default: "text-paper",
};

export function StatCard({ label, value, icon: Icon, accent = "default", delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="rounded-lg border border-line bg-white/[0.02] p-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-paper/50">{label}</span>
        <Icon className={cn("h-4 w-4", accentStyles[accent])} strokeWidth={1.75} />
      </div>
      <p className={cn("mt-2 font-mono text-2xl font-semibold tabular-nums", accentStyles[accent])}>
        {value}
      </p>
    </motion.div>
  );
}