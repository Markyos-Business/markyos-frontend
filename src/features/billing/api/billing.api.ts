import { ApiError, api } from "@/lib/api/client";
import type { Billing } from "@/types";
import type { BrandBillingAnswer, CancelReason } from "../types";

/*
 * The billing endpoints the Billing tab calls (billing epic 3.3–3.6). Every
 * answer carries the server's billing, which the caller applies; the browser
 * never works out a plan, a price, a status or a date.
 */
const id = (brandId: string) => encodeURIComponent(brandId);

export function fetchBrandBilling(brandId: string): Promise<BrandBillingAnswer> {
  return api<BrandBillingAnswer>(`/billing/brands/${id(brandId)}/`);
}

export function cancelPlan(brandId: string, reason: CancelReason, note?: string): Promise<{ status: string; billing: Billing }> {
  const trimmed = note?.trim();
  return api("/billing/paypal/cancel/", { method: "POST", body: { brandId, reason, ...(trimmed ? { note: trimmed } : {}) } });
}

/** A new subscription the server created to start when the paid month ends; PayPal's button approves it. */
export function startResume(brandId: string): Promise<{ subscriptionId: string; customId: string }> {
  return api("/billing/paypal/resume/", { method: "POST", body: { brandId } });
}

export function reactivatePlan(brandId: string): Promise<{ status: string; billing: Billing }> {
  return api("/billing/paypal/reactivate/", { method: "POST", body: { brandId } });
}

/** The refusal code the server put on a 4xx, if any. */
export function refusalCode(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const code = (error.data as { code?: unknown } | null)?.code;
  return typeof code === "string" ? code : null;
}
