import { api, ApiResponse } from "./api";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  myRole?: "OWNER" | "ADMIN" | "MANAGER" | "DEVELOPER" | "VIEWER";
  memberCount?: number;
  projectCount?: number;
}

export async function getMyOrganizations() {
  const res = await api.get<ApiResponse<{ organizations: Organization[] }>>("/organizations");
  return res.data.data.organizations;
}

export async function createOrganization(name: string) {
  const res = await api.post<ApiResponse<{ organization: Organization }>>("/organizations", {
    name,
  });
  return res.data.data.organization;
}