import { api, ApiResponse } from "./api";

export interface ProjectPlan {
  phases: { name: string; tasks: string[] }[];
}

export interface GeneratedTask {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

export async function generatePlan(organizationId: string, description: string) {
  const res = await api.post<ApiResponse<ProjectPlan>>("/ai/generate-plan", {
    organizationId,
    description,
  });
  return res.data.data;
}

export async function generateTasks(projectId: string, instruction: string) {
  const res = await api.post<ApiResponse<{ tasks: GeneratedTask[] }>>("/ai/generate-tasks", {
    projectId,
    instruction,
  });
  return res.data.data.tasks;
}

export async function summarizeTask(taskId: string) {
  const res = await api.get<ApiResponse<{ summary: string }>>(`/ai/tasks/${taskId}/summarize`);
  return res.data.data.summary;
}

export async function generateDescription(title: string, projectContext?: string) {
  const res = await api.post<ApiResponse<{ description: string }>>("/ai/generate-description", {
    title,
    projectContext,
  });
  return res.data.data.description;
}

export async function analyzeRisk(projectId: string) {
  const res = await api.get<ApiResponse<{ risks: { risk: string; severity: string; suggestedAction: string }[] }>>(
    `/ai/projects/${projectId}/risk`
  );
  return res.data.data.risks;
}