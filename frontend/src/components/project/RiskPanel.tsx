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
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="inline-flex items-center gap-2 rounded bg-ai-gradient px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {mutation.isPending ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        Analyze risk
      </button>

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