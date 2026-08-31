import { api, ApiResponse } from "./api";
import { Task, TaskStatus, TaskPriority } from "./tasks";

export interface SearchFilters {
  organizationId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  search?: string;
}

export async function searchTasks(filters: SearchFilters) {
  const res = await api.get<ApiResponse<{ tasks: Task[] }>>("/tasks/search", { params: filters });
  return res.data.data.tasks;
}