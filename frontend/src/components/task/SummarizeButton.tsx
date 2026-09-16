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
        Summarize discussion
      </button>

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
            className="mt-3 overflow-hidden rounded border border-transparent bg-ai-gradient-muted p-3"
            style={{ borderImage: "linear-gradient(135deg, #F472B640, #FB923C40) 1" }}
          >
            <p className="flex items-center gap-1.5 text-[11px] font-medium">
              <Sparkles className="h-3 w-3 text-pink-400" />
              <span className="bg-ai-gradient bg-clip-text text-transparent">AI Summary</span>
            </p>
            <p className="mt-1.5 text-sm text-paper/80">{summary}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}