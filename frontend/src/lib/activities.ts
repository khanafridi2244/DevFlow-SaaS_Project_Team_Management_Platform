import { api, ApiResponse } from "./api";

export interface Activity {
  id: string;
  action: string;
  metadata: Record<string, any> | null;
  createdAt: string;
  actor: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  project: { id: string; name: string } | null;
}

export async function getOrganizationActivity(organizationId: string) {
  const res = await api.get<ApiResponse<{ activities: Activity[] }>>(
    `/activities/organizations/${organizationId}`
  );
  return res.data.data.activities;
}