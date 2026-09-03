import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Loader2 } from "lucide-react";
import { generatePlan, generateTasks } from "@/lib/ai";
import { createProject } from "@/lib/projects";
import { createTask } from "@/lib/tasks";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useWorkspaceStore } from "@/store/workspaceStore";

interface GeneratePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Two-step flow: describe the project in plain language, AI returns
// phases + task titles, user reviews before anything gets created —
// nothing is written to the database until the user explicitly
// confirms, since AI output should always be a proposal, not an
// automatic action on someone's real workspace data.
export function GeneratePlanDialog({ open, onOpenChange }: GeneratePlanDialogProps) {
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [projectName, setProjectName] = useState("");
  const [step, setStep] = useState<"describe" | "review">("describe");

  const planMutation = useMutation({
    mutationFn: () => generatePlan(activeOrgId!, description),
    onSuccess: () => setStep("review"),
  });

  const createAllMutation = useMutation({
    mutationFn: async () => {
      if (!planMutation.data || !activeOrgId) return;

      const project = await createProject({
        organizationId: activeOrgId,
        name: projectName || description.slice(0, 50),
        description,
      });

      // Flatten every phase's tasks into real backend tasks, one at a
      // time — sequential rather than Promise.all so we don't hammer
      // the tasks endpoint with a burst of simultaneous requests for
      // a plan that might have 20+ tasks across all phases.
      for (const phase of planMutation.data.phases) {
        for (const title of phase.tasks) {
          await createTask({ projectId: project.id, title: `[${phase.name}] ${title}` });
        }
      }

      return project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects", activeOrgId] });
      onOpenChange(false);
      resetAndClose();
      if (project) window.location.href = `/projects/${project.id}`;
    },
  });

  function resetAndClose() {
    setDescription("");
    setProjectName("");
    setStep("describe");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) resetAndClose();
      }}
      title="Generate a project plan"
    >
      {step === "describe" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (description.trim()) planMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-paper/80">Describe what you're building</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="e.g. Build an e-commerce website with product catalog, cart, and checkout"
              className="w-full rounded border border-line bg-white/[0.03] px-3 py-2 text-sm text-paper placeholder:text-paper/30 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
              autoFocus
              required
            />
          </div>

          {planMutation.isError && (
            <p className="text-xs text-red-400">
              {(planMutation.error as any)?.response?.data?.message ?? "AI features aren't configured yet."}
            </p>
          )}

          <Button type="submit" className="w-full" isLoading={planMutation.isPending}>
            <Sparkles className="h-4 w-4" />
            Generate plan
          </Button>
        </form>
      )}

      {step === "review" && planMutation.data && (
        <div className="space-y-4">
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project name"
            className="w-full rounded border border-line bg-white/[0.03] px-3 py-2 text-sm text-paper placeholder:text-paper/30 focus:border-signal focus:outline-none"
          />

          <div className="max-h-64 space-y-3 overflow-y-auto">
            {planMutation.data.phases.map((phase, i) => (
              <div key={i} className="rounded border border-line p-3">
                <p className="text-sm font-medium text-paper">{phase.name}</p>
                <ul className="mt-1.5 space-y-1">
                  {phase.tasks.map((task, j) => (
                    <li key={j} className="text-xs text-paper/60">
                      · {task}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep("describe")}>
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={() => createAllMutation.mutate()}
              isLoading={createAllMutation.isPending}
            >
              {createAllMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                "Create project + tasks"
              )}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}