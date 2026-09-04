import { api, ApiResponse } from "./api";

export type Plan = "FREE" | "PRO" | "ENTERPRISE";

export interface Subscription {
  plan: Plan;
  seats: number;
}

export interface PlanLimits {
  maxProjects: number | null;
  maxMembers: number | null;
  maxTasks: number | null;
}

export async function getSubscription(organizationId: string) {
  const res = await api.get<ApiResponse<{ subscription: Subscription; limits: PlanLimits }>>(
    `/subscriptions/${organizationId}`
  );
  return res.data.data;
}

export async function changePlan(organizationId: string, plan: Plan) {
  const res = await api.patch<ApiResponse<{ subscription: Subscription }>>(
    `/subscriptions/${organizationId}`,
    { plan }
  );
  return res.data.data.subscription;
}