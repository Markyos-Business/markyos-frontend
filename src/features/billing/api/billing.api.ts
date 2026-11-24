import { ApiError, api } from "@/lib/api/client";
import type { Billing } from "@/types";
import type { BrandBillingAnswer, CancelReason, PromoTerms } from "../types";

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

/** A promo code's terms for this brand, or a 400 with the reason (promoRefusal). Throttled by the server. */
export function checkCode(brandId: string, code: string): Promise<PromoTerms> {
  return api<PromoTerms>("/billing/codes/check/", { method: "POST", body: { brandId, code } });
}

/**
 * Starts a checkout and returns the PayPal subscription id for the button.
 * Without a code the server names the plan and the button creates the
 * subscription on it; with a code the server reserves a use and creates the
 * subscription itself on the code's plan, so the button only approves it
 * (plan §2, like resume). The browser never names a plan or a price.
 */
export async function startSubscription(
  brandId: string,
  code: string | null,
  create: (plan: { plan_id: string; custom_id: string }) => Promise<string>,
): Promise<string> {
  if (code) {
    const { subscriptionId } = await api<{ subscriptionId: string; customId: string }>("/billing/paypal/start/", { method: "POST", body: { brandId, code } });
    return subscriptionId;
  }
  const { planId, customId } = await api<{ planId: string; customId: string }>("/billing/paypal/start/", { method: "POST", body: { brandId } });
  return create({ plan_id: planId, custom_id: customId });
}
