import { ApiError } from "@/lib/api/client";
import { formatMoney } from "@/lib/i18n/format";
import type { Lang } from "@/types/lang";
import { billingCopy } from "../copy";
import { PROMO_REFUSALS, type PromoCheckAnswer, type PromoRefusal, type PromoTerms, type SubscriptionDiscount } from "../types";

/** Long enough for any code the server makes, short enough to refuse a pasted paragraph. */
export const PROMO_CODE_MAX = 40;

/**
 * A typed code as it is shown and sent: upper case, no spaces. The server
 * ignores case and dashes too (plan §1); this only tidies the display, and a
 * code typed without its dashes ("mrk7kq4xp2m") gets them back.
 */
export function normaliseCode(input: string): string {
  const code = input.replace(/\s+/g, "").toUpperCase();
  const bare = code.match(/^MRK([A-Z0-9]{4})([A-Z0-9]{4})$/);
  return bare ? `MRK-${bare[1]}-${bare[2]}` : code;
}

/** A refusal reason the app has words for; any other is "unknown". */
export function asRefusal(reason: unknown): PromoRefusal {
  return typeof reason === "string" && (PROMO_REFUSALS as readonly string[]).includes(reason) ? (reason as PromoRefusal) : "unknown";
}

/**
 * Why checkout start refused a code, from its 400 `{detail, code}`; null
 * for any other failure (offline, throttled, a server fault), which
 * errorText words instead.
 */
export function promoRefusal(error: unknown): PromoRefusal | null {
  if (!(error instanceof ApiError) || error.status !== 400) return null;
  return asRefusal((error.data as { code?: unknown } | null)?.code);
}

/** The check's answer as the modal holds it: the terms, or why not. */
export function readCheck(answer: PromoCheckAnswer): { terms: PromoTerms } | { refused: PromoRefusal } {
  if (!answer.valid) return { refused: asRefusal(answer.reason) };
  return { terms: { code: answer.code, label: answer.label, ...answer.terms } };
}

/** "USD 14.50" for cents in a currency. */
const money = (cents: number, currency: string, lang: Lang) => formatMoney(cents / 100, currency.toUpperCase(), lang);

/** The upgrade modal's price line with a code, from the server's terms only. */
export function promoPriceLine(terms: PromoTerms, lang: Lang): string {
  const copy = billingCopy(lang === "ar").promo;
  return copy.price(money(terms.amount, terms.currency, lang), money(terms.regularAmount, terms.currency, lang), terms.months);
}

/**
 * The Billing tab's discount line, from the server's figures. The regular
 * price is the discount's own, else the subscription's amount; with
 * neither, there is no line rather than a guessed figure.
 */
export function discountLine(
  discount: SubscriptionDiscount,
  subscriptionAmount: number | null,
  currency: string,
  lang: Lang,
  formatDate: (ms: number) => string,
): string | null {
  const regular = discount.regularAmount ?? subscriptionAmount;
  if (discount.until && regular == null) return null;
  const copy = billingCopy(lang === "ar").promo;
  return copy.discount(
    discount.code,
    money(discount.amount, currency, lang),
    discount.until ? formatDate(discount.until) : null,
    regular == null ? "" : money(regular, currency, lang),
  );
}
