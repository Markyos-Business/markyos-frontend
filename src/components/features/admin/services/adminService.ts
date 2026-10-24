import { api } from "@/lib/api/client";
import type {
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
  if (query.isActive) params.set("is_active", query.isActive);
  if (query.ordering) params.set("ordering", query.ordering);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const qs = params.toString();
  return api<AdminUserPage>(`/admin/users/${qs ? `?${qs}` : ""}`);
}

export function updateUser(id: string, patch: AdminUserPatch): Promise<AdminUser> {
  return api<AdminUser>(`/admin/users/${id}/`, { method: "PATCH", body: patch });
}

export function revokeUserSessions(id: string): Promise<void> {
  return api<void>(`/admin/users/${id}/revoke-sessions/`, { method: "POST" });
}

export function listUserBrands(id: string): Promise<AdminUserBrand[]> {
  return api<AdminUserBrand[]>(`/admin/users/${id}/brands/`);
}
