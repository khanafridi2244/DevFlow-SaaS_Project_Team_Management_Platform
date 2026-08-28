import { api, ApiResponse } from "./api";

export interface Overview {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
}

export interface TasksByPriority {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  URGENT: number;
}

export interface TasksByStatus {
  TODO: number;
  IN_PROGRESS: number;
  IN_REVIEW: number;
  DONE: number;
}

export interface WorkloadEntry {
  user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  role: string;
  activeTaskCount: number;
  completedTaskCount: number;
}

export interface ProjectProgress {
  projectId: string;
  projectName: string;
  status: string;
  totalTasks: number;
  completedTasks: number;
  percentComplete: number;
}

export interface WeeklySeries {
  weekStart: string;
  count: number;
}

export async function getOverview(organizationId: string) {
  const res = await api.get<ApiResponse<Overview>>(`/analytics/${organizationId}/overview`);
  return res.data.data;
}

export async function getTasksByPriority(organizationId: string) {
  const res = await api.get<ApiResponse<{ byPriority: TasksByPriority }>>(
    `/analytics/${organizationId}/tasks-by-priority`
  );
  return res.data.data.byPriority;
}

export async function getTasksByStatus(organizationId: string) {
  const res = await api.get<ApiResponse<{ byStatus: TasksByStatus }>>(
    `/analytics/${organizationId}/tasks-by-status`
  );
  return res.data.data.byStatus;
}

export async function getTeamWorkload(organizationId: string) {
  const res = await api.get<ApiResponse<{ workload: WorkloadEntry[] }>>(
    `/analytics/${organizationId}/team-workload`
  );
  return res.data.data.workload;
}

export async function getProjectProgress(organizationId: string) {
  const res = await api.get<ApiResponse<{ progress: ProjectProgress[] }>>(
    `/analytics/${organizationId}/project-progress`
  );
  return res.data.data.progress;
}

export async function getCompletedPerWeek(organizationId: string, weeks = 8) {
  const res = await api.get<ApiResponse<{ series: WeeklySeries[] }>>(
    `/analytics/${organizationId}/completed-per-week`,
    { params: { weeks } }
  );
  return res.data.data.series;
}