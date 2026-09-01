import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { summarizeTask } from "@/lib/ai";
import { Button } from "@/components/ui/Button";

export function SummarizeButton({ taskId }: { taskId: string }) {
  const [summary, setSummary] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => summarizeTask(taskId),
    onSuccess: (result) => setSummary(result),
  });

  return (
    <div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => mutation.mutate()}
        isLoading={mutation.isPending}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Summarize discussion
      </Button>

      {mutation.isError && (
        <p className="mt-2 text-xs text-red-400">
          {(mutation.error as any)?.response?.data?.message ?? "AI features aren't configured yet."}
        </p>
      )}

      <AnimatePresence>
        {summary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden rounded border border-signal/20 bg-signal-muted/20 p-3"
          >
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-signal">
              <Sparkles className="h-3 w-3" /> AI Summary
            </p>
            <p className="mt-1.5 text-sm text-paper/80">{summary}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}