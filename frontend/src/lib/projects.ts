import { api, ApiResponse } from "./api";

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: "PLANNED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
  startDate: string | null;
  deadline: string | null;
  taskCount?: number;
  memberCount?: number;
  createdBy: { id: string; firstName: string; lastName: string };
}

export async function listProjects(organizationId: string) {
  const res = await api.get<ApiResponse<{ projects: Project[] }>>("/projects", {
    params: { organizationId },
  });
  return res.data.data.projects;
}

export async function createProject(payload: { organizationId: string; name: string; description?: string }) {
  const res = await api.post<ApiResponse<{ project: Project }>>("/projects", payload);
  return res.data.data.project;
}

export async function getProject(projectId: string) {
  const res = await api.get<ApiResponse<{ project: Project }>>(`/projects/${projectId}`);
  return res.data.data.project;
}