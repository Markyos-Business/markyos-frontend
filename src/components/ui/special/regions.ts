/**
 * Countries, locales and time zones for the pickers. Names come from the
 * browser's own locale data (Intl.DisplayNames), so they're right in English
 * and Arabic without a list to translate; codes are shown, never flags.
 */

/** The Gulf, the wider Arab region, then common others. */
const MENA = ["SA", "AE", "EG", "QA", "KW", "BH", "OM", "JO", "LB", "IQ", "MA", "TN", "DZ", "PS", "SY", "SD", "LY", "YE"];
const OTHERS = ["GB", "US", "FR", "DE", "TR", "IN", "PK", "MY", "ID", "CA", "AU", "NL", "ES", "IT", "SG", "CN", "JP"];
const COUNTRIES = [...MENA, ...OTHERS];

/** Locales offered by default: the region's Arabic and English. */
const LOCALES = ["ar-SA", "en-US", "ar-AE", "en-GB", "ar-EG", "fr-FR"];

const regionName = (code: string, lang: "en" | "ar") => new Intl.DisplayNames([lang], { type: "region" }).of(code) ?? code;

/** "Arabic (Saudi Arabia)" / "العربية (المملكة العربية السعودية)" for "ar-SA". */
const localeName = (tag: string, lang: "en" | "ar") => new Intl.DisplayNames([lang], { type: "language" }).of(tag) ?? tag;

/** The UTC offset of a time zone now, as "GMT+3" (or "GMT" for none). */
function zoneOffset(zone: string, at = new Date()): string {
  const part = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortOffset" }).formatToParts(at).find((p) => p.type === "timeZoneName");
  return part?.value ?? "GMT";
}

/** Minutes east of UTC, for sorting zones by offset. */
function offsetMinutes(zone: string, at = new Date()): number {
  const m = zoneOffset(zone, at).match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 0;
}

/** The region's zones first, then every zone the browser knows. */
const MENA_ZONES = ["Asia/Riyadh", "Asia/Dubai", "Africa/Cairo", "Asia/Qatar", "Asia/Kuwait", "Asia/Bahrain", "Asia/Muscat", "Asia/Amman", "Asia/Beirut", "Asia/Baghdad", "Africa/Casablanca", "Africa/Tunis"];

function allZones(): string[] {
  const known = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : MENA_ZONES;
  return [...MENA_ZONES, ...known.filter((z) => !MENA_ZONES.includes(z))];
}

/** "Riyadh" from "Asia/Riyadh"; "Buenos Aires" from "America/Argentina/Buenos_Aires". */
const zoneCity = (zone: string) => zone.split("/").pop()!.replace(/_/g, " ");

export { COUNTRIES, LOCALES, MENA, MENA_ZONES, allZones, localeName, offsetMinutes, regionName, zoneCity, zoneOffset };
