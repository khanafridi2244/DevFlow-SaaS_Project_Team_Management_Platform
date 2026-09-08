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

export interface ProjectMember {
  id: string;
  user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

export async function getProjectDetail(projectId: string) {
  const res = await api.get<ApiResponse<{ project: Project & { members: ProjectMember[] } }>>(
    `/projects/${projectId}`
  );
  return res.data.data.project;
}
export async function updateProject(
  projectId: string,
  payload: Partial<{ name: string; description: string; status: Project["status"] }>
) {
  const res = await api.patch<ApiResponse<{ project: Project }>>(`/projects/${projectId}`, payload);
  return res.data.data.project;
}

export async function deleteProject(projectId: string) {
  await api.delete(`/projects/${projectId}`);
}

export async function addProjectMember(projectId: string, userId: string) {
  const res = await api.post<ApiResponse<{ membership: ProjectMember }>>(
    `/projects/${projectId}/members`,
    { userId }
  );
  return res.data.data.membership;
}

export async function removeProjectMember(projectId: string, userId: string) {
  await api.delete(`/projects/${projectId}/members/${userId}`);
}