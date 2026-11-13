/**
 * Calendar dates as "YYYY-MM-DD" strings in local time: what the pickers
 * store, compare and hand back. A string sorts like the date it names, has no
 * time zone to drift across, and is what a backend `DateField` expects.
 */

/** Sunday, Monday or Saturday: the week starts differ across the region. */
type WeekStart = 0 | 1 | 6;
type IsoDate = string;

const pad = (n: number) => String(n).padStart(2, "0");

/** A `Date` as its local calendar day. */
const toIso = (d: Date): IsoDate => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** The local `Date` for a calendar day (midday, so no clock change moves it). */
const fromIso = (iso: IsoDate): Date => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};

const isIso = (v: unknown): v is IsoDate => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && toIso(fromIso(v)) === v;

const addDays = (iso: IsoDate, n: number): IsoDate => {
  const d = fromIso(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
};

/** The same day `n` months on, kept inside the month (31 Jan + 1 month → 28 Feb). */
const addMonths = (iso: IsoDate, n: number): IsoDate => {
  const d = fromIso(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return toIso(d);
};

const startOfMonth = (iso: IsoDate): IsoDate => `${iso.slice(0, 7)}-01`;
const endOfMonth = (iso: IsoDate): IsoDate => {
  const d = fromIso(iso);
  return toIso(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12));
};

/** The first day of `iso`'s week, for a week starting on `weekStart`. */
const startOfWeek = (iso: IsoDate, weekStart: WeekStart): IsoDate => addDays(iso, -((fromIso(iso).getDay() - weekStart + 7) % 7));

/** Six weeks of days covering `month`'s month, from its first week's start. */
const monthGrid = (month: IsoDate, weekStart: WeekStart): IsoDate[][] => {
  const first = startOfWeek(startOfMonth(month), weekStart);
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(first, w * 7 + d)));
};

const clampIso = (iso: IsoDate, min?: IsoDate, max?: IsoDate): IsoDate => (min && iso < min ? min : max && iso > max ? max : iso);

/** Western digits for Arabic-Indic and Persian ones. */
const westernDigits = (s: string) => s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0));

const MONTHS_EN = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Arabic month names as written in Saudi Arabia, the Levant and Egypt, to read typed Arabic dates. */
const MONTHS_AR = [
  ["يناير", "كانون الثاني"], ["فبراير", "شباط"], ["مارس", "آذار"], ["أبريل", "ابريل", "نيسان"], ["مايو", "أيار"], ["يونيو", "يونيه", "حزيران"],
  ["يوليو", "يوليه", "تموز"], ["أغسطس", "آب"], ["سبتمبر", "أيلول"], ["أكتوبر", "تشرين الأول"], ["نوفمبر", "تشرين الثاني"], ["ديسمبر", "كانون الأول"],
];

/**
 * A typed date, or null. Day first, never US order: "12 Sep 2026",
 * "12 September 2026", "12/09/2026", "12-9-2026", "2026-09-12", and the same
 * with Arabic month names or Arabic-Indic digits ("١٢ سبتمبر ٢٠٢٦").
 */
function parseTypedDate(input: string): IsoDate | null {
  const s = westernDigits(input).trim().toLowerCase().replace(/[,،]/g, " ").replace(/\s+/g, " ");
  if (!s) return null;
  let y: number, m: number, d: number;
  let hit: RegExpMatchArray | null;
  if ((hit = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/))) [y, m, d] = [+hit[1], +hit[2], +hit[3]];
  else if ((hit = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/))) [d, m, y] = [+hit[1], +hit[2], +hit[3]];
  else if ((hit = s.match(/^(\d{1,2}) ([^\d]+?) (\d{4})$/))) {
    const name = hit[2].trim();
    let idx = MONTHS_EN.findIndex((mm) => name.startsWith(mm));
    if (idx < 0) idx = MONTHS_AR.findIndex((names) => names.some((n) => name === n || name === `ال${n}`));
    if (idx < 0) return null;
    [d, m, y] = [+hit[1], idx + 1, +hit[3]];
  } else return null;
  const iso = `${y}-${pad(m)}-${pad(d)}`;
  return isIso(iso) ? iso : null;
}

/** The kit's date locale: Gregorian, Western digits unless asked otherwise. */
const dateLocale = (lang: "en" | "ar", digits: "latn" | "arab" = "latn", calendar = "gregory") =>
  lang === "ar" ? `ar-SA-u-nu-${digits}-ca-${calendar}` : `en-GB-u-nu-${digits}-ca-${calendar}`;

/**
 * "12 Sep 2026" (spec §7): day first, a three-letter month. Built from parts
 * because en-GB writes "Sept".
 */
function formatIso(iso: IsoDate, lang: "en" | "ar", digits: "latn" | "arab" = "latn"): string {
  const parts = new Intl.DateTimeFormat(lang === "ar" ? dateLocale("ar", digits) : `en-US-u-nu-${digits}`, { day: "numeric", month: "short", year: "numeric" }).formatToParts(fromIso(iso));
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return [part("day"), part("month"), part("year")].join(" ");
}

/** The Hijri (Umm al-Qura) day number and "month year" for a Gregorian day. */
function hijriOf(iso: IsoDate, lang: "en" | "ar", digits: "latn" | "arab" = "latn") {
  const fmt = new Intl.DateTimeFormat(dateLocale(lang, digits, "islamic-umalqura"), { day: "numeric", month: "long", year: "numeric" });
  const parts = fmt.formatToParts(fromIso(iso));
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { day: part("day"), monthYear: `${part("month")} ${part("year")}`.replace(/\s*(AH|هـ)$/u, "").trim() };
}

export { addDays, addMonths, clampIso, dateLocale, endOfMonth, formatIso, fromIso, hijriOf, isIso, monthGrid, parseTypedDate, startOfMonth, startOfWeek, toIso, westernDigits };
export type { IsoDate, WeekStart };
