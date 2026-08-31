import { api, ApiResponse } from "./api";
import { Task } from "./tasks";

export async function getCalendarTasks(organizationId: string, month: string) {
  // month must be "YYYY-MM", matching the backend's calendarQuerySchema
  const res = await api.get<ApiResponse<{ tasks: Task[] }>>("/tasks/calendar", {
    params: { organizationId, month },
  });
  return res.data.data.tasks;
}