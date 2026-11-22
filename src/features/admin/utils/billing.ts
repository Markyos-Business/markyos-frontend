import type { BadgeTone } from "@/components/ui";
import type { AccountLimits, LimitInput } from "../types";

/*
 * Pure helpers for the admin billing tool (billing epic 4.3). They name what
 * the server returned and check what an admin typed before it's sent; the
 * server still checks everything again and decides.
 */

export type CheckoutStatusKey = "active" | "pending" | "suspended" | "cancelled" | "expired" | "paid" | "refunded" | "refused" | "ended" | "other";

/** Our status (or PayPal's), as a word key and a tone. A refused checkout grants nothing, whatever its status. */
export function checkoutStatus(status: string | null | undefined, refused = false): { key: CheckoutStatusKey; tone: BadgeTone } {
  if (refused) return { key: "refused", tone: "danger" };
  const s = (status ?? "").toLowerCase();
  if (s === "active" || s === "trialing") return { key: "active", tone: "success" };
  if (["approval_pending", "approved", "pending", "incomplete", "created"].includes(s)) return { key: "pending", tone: "warning" };
  if (["suspended", "past_due", "unpaid"].includes(s)) return { key: "suspended", tone: "danger" };
  if (s === "cancelled" || s === "canceled") return { key: "cancelled", tone: "neutral" };
  if (s === "expired" || s === "incomplete_expired") return { key: "expired", tone: "neutral" };
  if (s === "paid") return { key: "paid", tone: "success" };
  if (s === "refunded" || s === "reversed") return { key: "refunded", tone: "neutral" };
  if (s === "ended") return { key: "ended", tone: "neutral" };
  return { key: "other", tone: "neutral" };
}

/** A comp still running: "End comp" applies. */
export function compRunning(row: { provider: string; status: string }): boolean {
  return row.provider === "comp" && checkoutStatus(row.status).key === "active";
}

/** "2026-12-18" for a local date. */
export function isoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The longest a comp may run (billing epic 4.3). */
export const COMP_MAX_YEARS = 2;
export const REASON_MAX = 500;

/** The dates a comp may end on: from tomorrow to two years from today. */
export function compBounds(now: Date): { min: string; max: string } {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const latest = new Date(now.getFullYear() + COMP_MAX_YEARS, now.getMonth(), now.getDate());
  return { min: isoDay(tomorrow), max: isoDay(latest) };
}

/** The end of the chosen day, local time, in ms: the comp lasts through it. */
export function endOfDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

export type CompErrors = { reason?: "required" | "tooLong"; expiresOn?: "required" | "past" | "tooFar" };

/** What's wrong with a comp before it's sent; empty when nothing is. */
export function validateComp(input: { reason: string; expiresOn: string | null }, now: Date): CompErrors {
  const errors: CompErrors = {};
  const reason = input.reason.trim();
  if (!reason) errors.reason = "required";
  else if (reason.length > REASON_MAX) errors.reason = "tooLong";
  const { min, max } = compBounds(now);
  if (!input.expiresOn) errors.expiresOn = "required";
  else if (input.expiresOn < min) errors.expiresOn = "past";
  else if (input.expiresOn > max) errors.expiresOn = "tooFar";
  return errors;
}

export type LimitChoice = "default" | "unlimited" | "number";
export type LimitDraft = { choice: LimitChoice; value: number | null };

/** The dialog's starting point for one limit: the override as it stands, or the default. */
export function limitDraft(limits: AccountLimits | undefined, key: "brands" | "editors"): LimitDraft {
  if (!limits?.override) return { choice: "default", value: null };
  const value = limits[key];
  return value === null ? { choice: "unlimited", value: null } : { choice: "number", value };
}

/** The value sent for one limit, or undefined while the number is missing or not a whole number from 0. */
export function limitInput(draft: LimitDraft): LimitInput | undefined {
  if (draft.choice === "default") return "default";
  if (draft.choice === "unlimited") return null;
  return draft.value !== null && Number.isInteger(draft.value) && draft.value >= 0 ? draft.value : undefined;
}

export type LimitErrors = { brands?: "number"; editors?: "number"; reason?: "required" | "tooLong" };

export function validateLimits(input: { brands: LimitDraft; editors: LimitDraft; reason: string }): LimitErrors {
  const errors: LimitErrors = {};
  if (limitInput(input.brands) === undefined) errors.brands = "number";
  if (limitInput(input.editors) === undefined) errors.editors = "number";
  const reason = input.reason.trim();
  if (!reason) errors.reason = "required";
  else if (reason.length > REASON_MAX) errors.reason = "tooLong";
  return errors;
}

const show = (value: unknown): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
};

/** What an audit entry changed, key by key: only the keys whose values differ, in name order. */
export function diffSummary(before: Record<string, unknown> | null, after: Record<string, unknown> | null): { key: string; from: string; to: string }[] {
  const a = before ?? {};
  const b = after ?? {};
  return [...new Set([...Object.keys(a), ...Object.keys(b)])]
    .sort()
    .filter((key) => JSON.stringify(a[key] ?? null) !== JSON.stringify(b[key] ?? null))
    .map((key) => ({ key, from: show(a[key]), to: show(b[key]) }));
}

/** "comp_created" → "Comp created": a server action without its own words still reads as words. */
export function humanize(code: string): string {
  const words = code.replace(/[._-]+/g, " ").trim().toLowerCase();
  return words ? words[0].toUpperCase() + words.slice(1) : code;
}
