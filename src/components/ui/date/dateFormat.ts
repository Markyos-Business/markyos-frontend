/** Every display format `AppDate` supports. */
type DateFormat = "month" | "month-year" | "short" | "long" | "datetime" | "relative";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Any supported input as a `Date`, or null when it is missing or invalid. */
const parseDate = (value: string | Date | null | undefined): Date | null => {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** "5 minutes ago", "yesterday", "in 3 weeks", in the given locale. */
const formatRelative = (date: Date, locale: string, now = Date.now()): string => {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const diff = date.getTime() - now;
  const abs = Math.abs(diff);
  if (abs < MINUTE) return rtf.format(Math.round(diff / 1000), "second");
  if (abs < HOUR) return rtf.format(Math.round(diff / MINUTE), "minute");
  if (abs < DAY) return rtf.format(Math.round(diff / HOUR), "hour");
  if (abs < 7 * DAY) return rtf.format(Math.round(diff / DAY), "day");
  if (abs < 30 * DAY) return rtf.format(Math.round(diff / (7 * DAY)), "week");
  if (abs < 365 * DAY) return rtf.format(Math.round(diff / (30 * DAY)), "month");
  return rtf.format(Math.round(diff / (365 * DAY)), "year");
};

const FORMAT_OPTIONS: Record<Exclude<DateFormat, "relative">, Intl.DateTimeFormatOptions> = {
  month: { month: "short" },
  "month-year": { month: "short", year: "2-digit" },
  short: { day: "numeric", month: "short", year: "numeric" },
  long: { day: "numeric", month: "long", year: "numeric" },
  datetime: { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true },
};

/** A valid date in the requested format and locale. */
const formatDate = (date: Date, format: DateFormat, locale: string, now?: number): string => {
  if (format === "relative") return formatRelative(date, locale, now);
  const formatted = new Intl.DateTimeFormat(locale, FORMAT_OPTIONS[format]).format(date);
  // Most locales write the am/pm marker in lower case; the app writes it in capitals.
  return FORMAT_OPTIONS[format].hour12 ? formatted.replace(/\b(am|pm)\b/i, (m) => m.toUpperCase()) : formatted;
};

export { formatDate, formatRelative, parseDate };
export type { DateFormat };
