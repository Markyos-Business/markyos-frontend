import { formatDayMonth } from "@/components/ui";

type Lang = "en" | "ar";

/** "12 Sep 2026": a date that needs its year, like when someone joined. */
export function formatDate(iso: string, lang: Lang = "en"): string {
  return formatDayMonth(new Date(iso), lang, true);
}

/** "12 Sep" this year, "12 Sep 2025" before it (spec §7). */
export function shortDate(iso: string, lang: Lang = "en", now = new Date()): string {
  const date = new Date(iso);
  return formatDayMonth(date, lang, date.getFullYear() !== now.getFullYear());
}

const UNITS: Record<Lang, { now: string; m: string; h: string; d: string }> = {
  en: { now: "now", m: "m", h: "h", d: "d" },
  ar: { now: "الآن", m: "د", h: "س", d: "ي" },
};

/** "10m", "2h", "3d"; a month or more back, the date instead. */
export function relativeTime(iso: string, lang: Lang = "en", now = new Date()): string {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000);
  const u = UNITS[lang];
  if (minutes < 1) return u.now;
  if (minutes < 60) return `${minutes}${u.m}`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}${u.h}`;
  if (minutes < 60 * 24 * 30) return `${Math.floor(minutes / (60 * 24))}${u.d}`;
  return shortDate(iso, lang, now);
}

/** "Nadeen Haddad" → "NH"; one word → its first two letters. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
