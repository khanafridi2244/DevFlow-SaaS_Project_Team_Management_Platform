import { api, ApiResponse } from "./api";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assignee: { id: string; firstName: string; lastName: string; avatarUrl: string | null } | null;
  createdBy: { id: string; firstName: string; lastName: string };
  labels: { id: string; name: string; color: string }[];
  _count: { comments: number; attachments: number };
}

export async function listTasks(projectId: string) {
  const res = await api.get<ApiResponse<{ tasks: Task[] }>>("/tasks", { params: { projectId } });
  return res.data.data.tasks;
}

export async function createTask(payload: {
  projectId: string;
  title: string;
  priority?: TaskPriority;
}) {
  const res = await api.post<ApiResponse<{ task: Task }>>("/tasks", payload);
  return res.data.data.task;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const res = await api.patch<ApiResponse<{ task: Task }>>(`/tasks/${taskId}/status`, { status });
  return res.data.data.task;
}