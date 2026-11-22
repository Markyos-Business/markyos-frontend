import { formatDayMonth } from "@/components/ui";
import { formatMoney } from "@/lib/i18n/format";

type Lang = "en" | "ar";

/** "18 Dec 2026" for a server time in ms; "—" when there is none. */
export const day = (ms: number | null | undefined, lang: Lang) => (ms ? formatDayMonth(new Date(ms), lang, true) : "—");

/** "USD 29" for cents in a currency; "—" when there's no amount. */
export const money = (cents: number | null | undefined, currency: string, lang: Lang) =>
  cents === null || cents === undefined ? "—" : formatMoney(cents / 100, (currency || "usd").toUpperCase(), lang);
