import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { listProjects, createProject } from "@/lib/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";

export default function ProjectsPage() {
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");

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
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOrgId || !name.trim()) return;
    createMutation.mutate({ organizationId: activeOrgId, name: name.trim() });
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-paper">Projects</h1>
          <p className="mt-1 text-sm text-paper/50">Everything your team is building.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-paper/40">Loading...</p>
      ) : projects?.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-line p-8 text-center text-sm text-paper/40">
          No projects yet. Create one to get started.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-4">
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
          <Button type="submit" className="w-full" isLoading={createMutation.isPending}>
            Create project
          </Button>
        </form>
      </Dialog>
    </div>
  );
}