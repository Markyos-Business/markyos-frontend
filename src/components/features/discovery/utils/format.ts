/*
 * Dates and times the way the design system writes them (MARKYOS_UI.md §7):
 * relative times as 10m / 2hr / 2d, dates as 12 Sep and 31 Dec 2026, never US
 * order, Western numerals in both languages.
 */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** "10m", "2hr", "3d", or a short date past a fortnight. */
export const formatAgo = (iso: string | null | undefined, isAr: boolean, now: number = Date.now()): string => {
  if (!iso) return "—";
  const diff = Math.max(0, now - Date.parse(iso));
  if (diff < MIN) return isAr ? "الآن" : "now";
  if (diff < HOUR) return isAr ? `${Math.round(diff / MIN)} د` : `${Math.round(diff / MIN)}m`;
  if (diff < DAY) return isAr ? `${Math.round(diff / HOUR)} س` : `${Math.round(diff / HOUR)}hr`;
  if (diff < 14 * DAY) return isAr ? `${Math.round(diff / DAY)} ي` : `${Math.round(diff / DAY)}d`;
  return formatDay(iso, isAr, now);
};

// Gregorian with Latin digits in Arabic too: the default Arabic locale in some
// engines is the Hijri calendar with Arabic-Indic digits.
const AR_LOCALE = "ar-EG-u-nu-latn-ca-gregory";

// Spelled out rather than left to Intl: recent ICU writes "Sept" in en-GB,
// and the design system's dates are "12 Sep".
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "12 Sep", or "31 Dec 2026" when it isn't this year. */
export const formatDay = (iso: string | null | undefined, isAr: boolean, now: number = Date.now()): string => {
  if (!iso) return "—";
  const date = new Date(iso);
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  if (!isAr) return `${date.getDate()} ${MONTHS[date.getMonth()]}${sameYear ? "" : ` ${date.getFullYear()}`}`;
  return new Intl.DateTimeFormat(AR_LOCALE, { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) }).format(date);
};

/** "12 Sep, 14:05". */
export const formatDayTime = (iso: string | null | undefined, isAr: boolean): string => {
  if (!iso) return "—";
  const date = new Date(iso);
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return `${formatDay(iso, isAr)}, ${time}`;
};

/** "2d 4hr", "35m": how long something took. */
export const formatDuration = (seconds: number | null | undefined, isAr: boolean): string => {
  if (seconds == null) return "—";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.max(1, Math.round((seconds % 3600) / 60));
  if (days) return isAr ? `${days} ي ${hours} س` : `${days}d ${hours}hr`;
  if (hours) return isAr ? `${hours} س ${minutes} د` : `${hours}hr ${minutes}m`;
  return isAr ? `${minutes} د` : `${minutes}m`;
};
