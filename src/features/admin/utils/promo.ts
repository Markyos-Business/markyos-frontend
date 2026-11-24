import type { Plans, PromoCodeRow, PromoDuration, PromoGenerateRequest, PromoStatus } from "@/features/billing";
import type { BadgeTone } from "@/components/ui";
import { formatMoney, formatNumber } from "@/lib/i18n/format";
import type { AccountType } from "@/types";
import type { Lang } from "@/types/lang";
import { ADMIN_PROMO_COPY } from "../promo-copy";
import { endOfDay, isoDay, REASON_MAX } from "./billing";

/*
 * The Generate codes form and the words for a code (promo-codes-plan §1, §3).
 * The server makes the codes, checks every setting again and works out what
 * a brand pays; the preview here is for the admin's eyes only.
 */

export const COUNT_MAX = 500;
export const MONTHS_MAX = 24;
export const PERCENT_MAX = 99;
/** Never below USD 1 a month (plan §1): a bigger discount is a comp, not a code. */
export const FLOOR_CENTS = 100;
export const ALL_TYPES: readonly AccountType[] = ["studio", "freelancer", "company"];

export type DiscountKind = "percent" | "amount";

export type GenerateForm = {
  count: number | null;
  usesPerCode: number | null;
  kind: DiscountKind;
  percentOff: number | null;
  /** In the currency's units ("5" = USD 5), as typed. */
  amountOff: number | null;
  duration: PromoDuration;
  months: number | null;
  /** "YYYY-MM-DD": the last day it can be redeemed. */
  expiresOn: string | null;
  /** None ticked = every type. */
  accountTypes: AccountType[];
  firstPurchaseOnly: boolean;
  note: string;
};

/** Plan §1's defaults: one single-use code, 3 months, first purchases only. */
export const DEFAULT_GENERATE: GenerateForm = {
  count: 1,
  usesPerCode: 1,
  kind: "percent",
  percentOff: null,
  amountOff: null,
  duration: "repeating",
  months: 3,
  expiresOn: null,
  accountTypes: [],
  firstPurchaseOnly: true,
  note: "",
};

export type GenerateErrors = Partial<{
  count: "range";
  usesPerCode: "range";
  discount: "percent" | "amount" | { belowFloor: AccountType };
  months: "range";
  expiresOn: "past";
  note: "required" | "tooLong";
}>;

const whole = (n: number | null, min: number, max = Infinity) => n !== null && Number.isInteger(n) && n >= min && n <= max;

/** The types a code applies to: the ticked ones, or all of them. */
export const typesOf = (form: Pick<GenerateForm, "accountTypes">): readonly AccountType[] => (form.accountTypes.length ? form.accountTypes : ALL_TYPES);

/** Cents a month during the discount, for a regular price; never below the floor. Null without a valid discount. */
export function discountedCents(regular: number, form: Pick<GenerateForm, "kind" | "percentOff" | "amountOff">): number | null {
  if (form.kind === "percent") {
    if (!whole(form.percentOff, 1, PERCENT_MAX)) return null;
    return Math.round((regular * (100 - form.percentOff!)) / 100);
  }
  if (form.amountOff === null || !(form.amountOff > 0)) return null;
  return regular - Math.round(form.amountOff * 100);
}

/** What's wrong with the form, field by field; `plans` adds the USD 1 floor check per type. */
export function validateGenerate(form: GenerateForm, today: Date, plans?: Plans | null): GenerateErrors {
  const errors: GenerateErrors = {};
  if (!whole(form.count, 1, COUNT_MAX)) errors.count = "range";
  if (form.usesPerCode !== null && !whole(form.usesPerCode, 1)) errors.usesPerCode = "range";
  if (form.kind === "percent" && !whole(form.percentOff, 1, PERCENT_MAX)) errors.discount = "percent";
  if (form.kind === "amount" && !(form.amountOff !== null && form.amountOff > 0)) errors.discount = "amount";
  if (!errors.discount && plans) {
    const low = typesOf(form).find((type) => {
      const price = plans.types[type]?.monthly;
      const cents = price === undefined ? null : discountedCents(price, form);
      return cents !== null && cents < FLOOR_CENTS;
    });
    if (low) errors.discount = { belowFloor: low };
  }
  if (form.duration === "repeating" && !whole(form.months, 1, MONTHS_MAX)) errors.months = "range";
  if (form.expiresOn && form.expiresOn < isoDay(today)) errors.expiresOn = "past";
  const note = form.note.trim();
  if (!note) errors.note = "required";
  else if (note.length > REASON_MAX) errors.note = "tooLong";
  return errors;
}

/** The request for a valid form. Account types go only when some, not all, are ticked. */
export function toGenerateRequest(form: GenerateForm): PromoGenerateRequest {
  const request: PromoGenerateRequest = {
    count: form.count!,
    usesPerCode: form.usesPerCode,
    duration: form.duration,
    firstPurchaseOnly: form.firstPurchaseOnly,
    note: form.note.trim(),
  };
  if (form.kind === "percent") request.percentOff = form.percentOff!;
  else request.amountOff = Math.round(form.amountOff! * 100);
  if (form.duration === "repeating") request.months = form.months!;
  if (form.expiresOn) request.expiresAt = endOfDay(form.expiresOn);
  if (form.accountTypes.length && form.accountTypes.length < ALL_TYPES.length) request.accountTypes = [...form.accountTypes];
  return request;
}

const money = (cents: number, currency: string, lang: Lang) => formatMoney(cents / 100, currency.toUpperCase(), lang);

/**
 * The preview: what a brand of each type would pay, from the server's
 * /billing/plans/ prices. Display only; the server prices the real thing.
 */
export function previewLines(form: GenerateForm, plans: Plans, lang: Lang, typeLabel: (type: AccountType) => string): string[] {
  const f = ADMIN_PROMO_COPY[lang].form;
  const lines: string[] = [];
  for (const type of typesOf(form)) {
    const regular = plans.types[type]?.monthly;
    if (regular === undefined) continue;
    const first = discountedCents(regular, form);
    if (first === null) return [];
    const months = form.duration === "once" ? 1 : (form.months ?? 0);
    if (form.duration === "repeating" && !whole(form.months, 1, MONTHS_MAX)) return [];
    lines.push(f.previewLine(typeLabel(type), money(Math.max(first, FLOOR_CENTS), plans.currency, lang), money(regular, plans.currency, lang), form.duration, months));
  }
  return lines;
}

/** "50% for 3 months", in the reader's language from the code's own fields; the server's label otherwise. */
export function discountLabel(row: Pick<PromoCodeRow, "label" | "percentOff" | "amountOff" | "duration" | "months" | "currency">, lang: Lang): string {
  const d = ADMIN_PROMO_COPY[lang].discount;
  if (!row.duration || (row.percentOff == null && row.amountOff == null)) return row.label;
  const off = row.percentOff != null ? d.percent(formatNumber(row.percentOff, lang)) : d.amount(money(row.amountOff!, row.currency ?? "usd", lang));
  return d.join(off, d.duration(row.duration, row.months ?? null));
}

export const PROMO_STATUS_TONE: Record<PromoStatus, BadgeTone> = { active: "success", used_up: "neutral", expired: "warning", disabled: "danger" };

/** A status the server may add later shows as neutral, in its own words. */
export const promoStatusTone = (status: string): BadgeTone => PROMO_STATUS_TONE[status as PromoStatus] ?? "neutral";

/** A batch id short enough for a cell: the first eight characters. */
export const shortBatch = (id: string) => (id.length > 8 ? id.slice(0, 8) : id);
