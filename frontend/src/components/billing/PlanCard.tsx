import { Check } from "lucide-react";
import { Plan } from "@/lib/subscription";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  plan: Plan;
  isCurrent: boolean;
  canUpgrade: boolean;
  onSelect: () => void;
  isLoading: boolean;
}

const PLAN_INFO: Record<Plan, { price: string; features: string[] }> = {
  FREE: { price: "$0", features: ["2 projects", "5 members", "100 tasks"] },
  PRO: {
    price: "$12/mo",
    features: ["Unlimited projects", "Unlimited members", "Unlimited tasks", "AI Assistant", "Advanced analytics"],
  },
  ENTERPRISE: {
    price: "Contact us",
    features: ["Everything in Pro", "Advanced permissions", "Priority support"],
  },
};

export function PlanCard({ plan, isCurrent, canUpgrade, onSelect, isLoading }: PlanCardProps) {
  const info = PLAN_INFO[plan];

  return (
    <div
      className={cn(
        "rounded-lg border p-5",
        isCurrent ? "border-signal bg-signal-muted/10" : "border-line bg-white/[0.02]"
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-sm font-semibold text-paper">{plan}</h3>
        {isCurrent && (
          <span className="rounded bg-signal-muted px-2 py-0.5 font-mono text-[10px] text-signal">
            Current
          </span>
        )}
      </div>
      <p className="mt-1 text-2xl font-semibold text-paper">{info.price}</p>

      <ul className="mt-4 space-y-2">
        {info.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-paper/70">
            <Check className="h-3.5 w-3.5 text-done" />
            {feature}
          </li>
        ))}
      </ul>

      {!isCurrent && canUpgrade && (
        <Button variant="secondary" className="mt-5 w-full" onClick={onSelect} isLoading={isLoading}>
          Switch to {plan}
        </Button>
      )}
    </div>
  );
}