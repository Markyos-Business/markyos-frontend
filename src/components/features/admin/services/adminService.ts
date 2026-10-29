import { api } from "@/lib/api/client";
import type {
  AdminActivity,
  AdminBulkAction,
  AdminBulkResult,
  AdminInvite,
  AdminSession,
  AdminStats,
  AdminUser,
  AdminUserBrand,
  AdminUserPage,
  AdminUserPatch,
  AdminUserQuery,
} from "../types";

export function getStats(): Promise<AdminStats> {
  return api<AdminStats>("/admin/stats/");
}

export function listUsers(query: AdminUserQuery = {}): Promise<AdminUserPage> {
  const params = new URLSearchParams();
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.role) params.set("role", query.role);
  if (query.accountType) params.set("account_type", query.accountType);
  if (query.status) params.set("status", query.status);
  if (query.language) params.set("language", query.language);
  if (query.lastActiveFrom) params.set("last_active_from", query.lastActiveFrom);
  if (query.lastActiveTo) params.set("last_active_to", query.lastActiveTo);
  if (query.ordering) params.set("ordering", query.ordering);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.pageSize) params.set("page_size", String(query.pageSize));
  const qs = params.toString();
  return api<AdminUserPage>(`/admin/users/${qs ? `?${qs}` : ""}`);
}

export function getUser(id: string): Promise<AdminUser> {
  return api<AdminUser>(`/admin/users/${id}/`);
}

export function inviteUser(invite: AdminInvite): Promise<AdminUser> {
  return api<AdminUser>("/admin/users/", { method: "POST", body: invite });
}

export function updateUser(id: string, patch: AdminUserPatch): Promise<AdminUser> {
  return api<AdminUser>(`/admin/users/${id}/`, { method: "PATCH", body: patch });
}

export function removeUser(id: string): Promise<void> {
  return api<void>(`/admin/users/${id}/`, { method: "DELETE" });
}

export function resendInvite(id: string): Promise<void> {
  return api<void>(`/admin/users/${id}/resend-invite/`, { method: "POST" });
}

export function bulkUpdate(ids: string[], action: AdminBulkAction, role?: AdminUser["role"]): Promise<AdminBulkResult> {
  return api<AdminBulkResult>("/admin/users/bulk/", { method: "POST", body: { ids, action, role } });
}

export function revokeUserSessions(id: string): Promise<void> {
  return api<void>(`/admin/users/${id}/revoke-sessions/`, { method: "POST" });
}

export function listUserSessions(id: string): Promise<AdminSession[]> {
  return api<AdminSession[]>(`/admin/users/${id}/sessions/`);
}

export function endUserSession(id: string, sessionId: string): Promise<void> {
  return api<void>(`/admin/users/${id}/sessions/${sessionId}/`, { method: "DELETE" });
}

export function getUserActivity(id: string): Promise<AdminActivity[]> {
  return api<AdminActivity[]>(`/admin/users/${id}/activity/`);
}

export function listUserBrands(id: string): Promise<AdminUserBrand[]> {
  return api<AdminUserBrand[]>(`/admin/users/${id}/brands/`);
}
