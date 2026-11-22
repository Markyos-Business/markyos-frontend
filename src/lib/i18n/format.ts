import type { Lang } from "@/types/lang";

/**
 * Numbers for the interface language. Arabic keeps Western digits (spec §8:
 * "Use Western numerals unless the customer asks otherwise"), so the Arabic
 * locale is pinned to the Latin numbering system; grouping and the decimal
 * mark still follow the language.
 *
 * Dates live in the kit (`AppDate`, `formatDate`); this file is for counts,
 * sizes, percentages and money.
 */
const LOCALE: Record<Lang, string> = { en: "en-GB", ar: "ar-SA-u-nu-latn" };

const formatNumber = (value: number, lang: Lang, options?: Intl.NumberFormatOptions): string =>
  new Intl.NumberFormat(LOCALE[lang], options).format(value);

/** `0.42` → "42%". Pass a fraction, not a percentage. */
const formatPercent = (fraction: number, lang: Lang, maximumFractionDigits = 0): string =>
  formatNumber(fraction, lang, { style: "percent", maximumFractionDigits });

/** Spec §7: "SAR 84,500" — the code, not a symbol, and no decimals for whole amounts. */
const formatMoney = (amount: number, currency: string, lang: Lang): string =>
  formatNumber(amount, lang, {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });

export { LOCALE, formatMoney, formatNumber, formatPercent };
