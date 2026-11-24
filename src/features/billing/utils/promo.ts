import { ApiError } from "@/lib/api/client";
import { formatMoney } from "@/lib/i18n/format";
import type { Lang } from "@/types/lang";
import { billingCopy } from "../copy";
import { PROMO_REFUSALS, type PromoRefusal, type PromoTerms, type SubscriptionDiscount } from "../types";

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

/**
 * The reason a code was refused, from the server's 400: one of the known
 * codes, "unknown" for a 400 naming none, or null for any other failure
 * (offline, throttled, a server fault), which errorText words instead.
 */
export function promoRefusal(error: unknown): PromoRefusal | null {
  if (!(error instanceof ApiError) || error.status !== 400) return null;
  const code = (error.data as { code?: unknown } | null)?.code;
  return typeof code === "string" && (PROMO_REFUSALS as readonly string[]).includes(code) ? (code as PromoRefusal) : "unknown";
}

/** "USD 14.50" for cents in a currency. */
const money = (cents: number, currency: string, lang: Lang) => formatMoney(cents / 100, currency.toUpperCase(), lang);

/** The upgrade modal's price line with a code, from the server's terms only. */
export function promoPriceLine(terms: PromoTerms, lang: Lang): string {
  const copy = billingCopy(lang === "ar").promo;
  return copy.price(money(terms.firstAmount, terms.currency, lang), money(terms.regularAmount, terms.currency, lang), terms.months);
}

/**
 * The Billing tab's discount line. The regular price is the discount's own
 * when the server sends it, else the subscription's amount; with neither,
 * there is no line rather than a guessed figure.
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
