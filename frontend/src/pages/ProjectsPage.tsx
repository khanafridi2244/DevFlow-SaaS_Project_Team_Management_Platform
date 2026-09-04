import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { listProjects, createProject } from "@/lib/projects";
import { ProjectCard } from "@/components/project/ProjectCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { GeneratePlanDialog } from "@/components/ai/GeneratePlanDialog";

export default function ProjectsPage() {
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", activeOrgId],
    queryFn: () => listProjects(activeOrgId!),
    enabled: !!activeOrgId,
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", activeOrgId] });
      setIsDialogOpen(false);
      setName("");
      setFormError("");
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!activeOrgId) {
      setFormError("Select or create a workspace first, using the switcher in the sidebar.");
      return;
    }
    if (!name.trim()) return;

    createMutation.mutate({ organizationId: activeOrgId, name: name.trim() });
  }

  return (
    <div className="p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-paper">Projects</h1>
          <p className="mt-1 text-sm text-paper/50">Everything your team is building.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsAiDialogOpen(true)}>
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New project
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-paper/40">Loading...</p>
      ) : projects?.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-line p-8 text-center text-sm text-paper/40">
          No projects yet. Create one to get started.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project, i) => (
            <ProjectCard key={project.id} project={project} delay={i * 0.03} />
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} title="New project">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            id="project-name"
            label="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
          {formError && (
            <p className="rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {formError}
            </p>
          )}
          <Button type="submit" className="w-full" isLoading={createMutation.isPending}>
            Create project
          </Button>
        </form>
      </Dialog>

      <GeneratePlanDialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen} />
    </div>
  );
}