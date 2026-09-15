import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: "signal" | "indigo" | "violet" | "emerald" | "done" | "warn" | "default";
  delay?: number;
}

const accentStyles = {
  signal: "text-signal",
  indigo: "text-indigo",
  violet: "text-violet",
  emerald: "text-emerald",
  done: "text-done",
  warn: "text-warn",
  default: "text-paper",
};

const glowStyles = {
  signal: "hover:shadow-glow-signal",
  indigo: "hover:shadow-[0_0_0_1px_rgba(99,102,241,0.2),0_8px_24px_rgba(99,102,241,0.15)]",
  violet: "hover:shadow-[0_0_0_1px_rgba(167,139,250,0.2),0_8px_24px_rgba(167,139,250,0.15)]",
  emerald: "hover:shadow-[0_0_0_1px_rgba(52,211,153,0.2),0_8px_24px_rgba(52,211,153,0.15)]",
  done: "hover:shadow-[0_0_0_1px_rgba(63,182,139,0.2),0_8px_24px_rgba(63,182,139,0.15)]",
  warn: "hover:shadow-[0_0_0_1px_rgba(230,162,60,0.2),0_8px_24px_rgba(230,162,60,0.15)]",
  default: "hover:shadow-glow",
};

export function StatCard({ label, value, icon: Icon, accent = "default", delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className={cn(
        "rounded-lg border border-line bg-white/[0.02] p-4 transition-shadow",
        glowStyles[accent]
      )}
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