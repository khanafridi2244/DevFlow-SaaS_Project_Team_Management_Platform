import { cn } from "@/lib/utils";

interface UsageBarProps {
  label: string;
  current: number;
  max: number | null; // null = unlimited
}

export function UsageBar({ label, current, max }: UsageBarProps) {
  const isUnlimited = max === null;
  const percent = isUnlimited ? 0 : Math.min(100, (current / max) * 100);
  const isNearLimit = !isUnlimited && percent >= 80;

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-paper/60">{label}</span>
        <span className={cn("font-mono", isNearLimit ? "text-warn" : "text-paper/40")}>
          {current} / {isUnlimited ? "∞" : max}
        </span>
      </div>
      {!isUnlimited && (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className={cn("h-full rounded-full transition-all", isNearLimit ? "bg-warn" : "bg-signal")}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}