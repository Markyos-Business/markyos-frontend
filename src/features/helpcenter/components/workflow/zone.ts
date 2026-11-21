/** Formats an instant in the Help timezone, and names that zone in the reader's language. */
export function inZone(iso: string, zone: string, lang: "en" | "ar") {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-u-nu-latn" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: zone }).format(new Date(iso));
}

export function zoneName(zone: string, lang: "en" | "ar") {
  const parts = new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en-GB", { timeZone: zone, timeZoneName: "long" }).formatToParts(new Date());
  return parts.find((p) => p.type === "timeZoneName")?.value ?? zone;
}

/** Tomorrow at 09:00 in `zone`, as "YYYY-MM-DDTHH:mm": a sensible first suggestion. */
export function tomorrowNine(zone: string) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + 86_400_000));
  return `${today}T09:00`;
}
