import { api, ApiResponse } from "./api";

export type OrgRole = "OWNER" | "ADMIN" | "MANAGER" | "DEVELOPER" | "VIEWER";

export interface Member {
  id: string; // membership id, not user id
  role: OrgRole;
  user: { id: string; email: string; firstName: string; lastName: string; avatarUrl: string | null };
}

export async function getOrganizationDetail(organizationId: string) {
  const res = await api.get<ApiResponse<{ organization: { id: string; name: string; members: Member[] } }>>(
    `/organizations/${organizationId}`
  );
  return res.data.data.organization;
}

export async function inviteMember(organizationId: string, email: string, role: OrgRole) {
  const res = await api.post<ApiResponse<{ membership: Member }>>(
    `/organizations/${organizationId}/members`,
    { email, role }
  );
  return res.data.data.membership;
}

export async function updateMemberRole(organizationId: string, memberId: string, role: OrgRole) {
  const res = await api.patch<ApiResponse<{ membership: Member }>>(
    `/organizations/${organizationId}/members/${memberId}`,
    { role }
  );
  return res.data.data.membership;
}

export async function removeMember(organizationId: string, memberId: string) {
  await api.delete(`/organizations/${organizationId}/members/${memberId}`);
}