import { useMutation } from "@tanstack/react-query";
import { Sparkles, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeRisk } from "@/lib/ai";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES: Record<string, string> = {
  LOW: "border-line text-paper/50",
  MEDIUM: "border-warn/30 text-warn",
  HIGH: "border-red-500/30 text-red-400",
};

export function RiskPanel({ projectId }: { projectId: string }) {
  const mutation = useMutation({
    mutationFn: () => analyzeRisk(projectId),
  });

  return (
    <div>
      <Button variant="secondary" size="sm" onClick={() => mutation.mutate()} isLoading={mutation.isPending}>
        <Sparkles className="h-3.5 w-3.5" />
        Analyze risk
      </Button>

      {mutation.isError && (
        <p className="mt-2 text-xs text-red-400">
          {(mutation.error as any)?.response?.data?.message ?? "AI features aren't configured yet."}
        </p>
      )}

      <AnimatePresence>
        {mutation.data && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2 overflow-hidden"
          >
            {mutation.data.length === 0 && (
              <p className="text-sm text-paper/40">No significant risks detected.</p>
            )}
            {mutation.data.map((risk, i) => (
              <div key={i} className={cn("rounded border p-3", SEVERITY_STYLES[risk.severity])}>
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  {risk.severity}
                </div>
                <p className="mt-1 text-sm text-paper/80">{risk.risk}</p>
                <p className="mt-1 text-xs text-paper/50">→ {risk.suggestedAction}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}