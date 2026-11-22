import { api } from "@/lib/api/client";
import type {
  AdminAuditEntry,
  AdminAuditPage,
  AdminCheckoutDetail,
  AdminCheckoutPage,
  AdminCheckoutQuery,
  AdminCompRequest,
  AdminOrphanPage,
  AdminUser,
  LimitInput,
} from "../types";

/*
 * The admin billing endpoints (billing epic 4.3). The server reads PayPal,
 * decides and records; these only ask. Every write carries a reason, which
 * the server keeps in the audit log.
 */
const id = (value: string) => encodeURIComponent(value);

export function listCheckouts(query: AdminCheckoutQuery = {}): Promise<AdminCheckoutPage> {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.status) params.set("status", query.status);
  if (query.provider) params.set("provider", query.provider);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const qs = params.toString();
  return api<AdminCheckoutPage>(`/admin/billing/checkouts/${qs ? `?${qs}` : ""}`);
}

export function getCheckout(checkoutId: string): Promise<AdminCheckoutDetail> {
  return api<AdminCheckoutDetail>(`/admin/billing/checkouts/${id(checkoutId)}/`);
}

export function syncCheckout(checkoutId: string, reason?: string): Promise<AdminCheckoutDetail> {
  const trimmed = reason?.trim();
  return api<AdminCheckoutDetail>(`/admin/billing/checkouts/${id(checkoutId)}/sync/`, { method: "POST", body: trimmed ? { reason: trimmed } : {} });
}

/** Orphaned subscriptions a page at a time (25), newest first. */
export function listOrphans(page = 1): Promise<AdminOrphanPage> {
  return api<AdminOrphanPage>(`/admin/billing/orphans/${page > 1 ? `?page=${page}` : ""}`);
}

export function compPlan(request: AdminCompRequest): Promise<unknown> {
  return api("/admin/billing/comps/", { method: "POST", body: { ...request, reason: request.reason.trim() } });
}

export function endComp(checkoutId: string, reason: string): Promise<unknown> {
  return api(`/admin/billing/comps/${id(checkoutId)}/end/`, { method: "POST", body: { reason: reason.trim() } });
}

/** The audit log a page at a time; a plain list (no paging) is read as one page. */
export async function listAudit(page = 1): Promise<AdminAuditPage> {
  const answer = await api<AdminAuditPage | AdminAuditEntry[]>(`/admin/billing/audit/${page > 1 ? `?page=${page}` : ""}`);
  return Array.isArray(answer) ? { count: answer.length, results: answer } : answer;
}

/**
 * Changes an account's brand and/or editor limits; a key left out stays as
 * it is. The server checks the reason, records it and answers with the account.
 */
export function overrideLimits(accountId: string, limits: Partial<Record<"brands" | "editors", LimitInput>>, reason: string): Promise<AdminUser> {
  return api<AdminUser>(`/admin/accounts/${id(accountId)}/limits/`, { method: "POST", body: { ...limits, reason: reason.trim() } });
}
