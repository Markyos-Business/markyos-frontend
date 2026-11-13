import type { CountryCode } from "libphonenumber-js";

/**
 * International dialling codes offered by the phone field: Saudi Arabia (the
 * default), the UAE and Egypt first, then the wider Arab region, then a short
 * list of common others. Each is labelled by its ISO code ("SA +966"), never
 * a flag (spec §7: no emoji, locales as codes). `iso` is what the number is
 * formatted and checked against.
 */
type DialCode = { code: string; iso: CountryCode; label: string };

const dial = (iso: CountryCode, code: string): DialCode => ({ code, iso, label: `${iso} ${code}` });

const DIAL_CODES: readonly DialCode[] = [
  dial("SA", "+966"),
  dial("AE", "+971"),
  dial("EG", "+20"),
  dial("QA", "+974"),
  dial("KW", "+965"),
  dial("BH", "+973"),
  dial("OM", "+968"),
  dial("JO", "+962"),
  dial("LB", "+961"),
  dial("MA", "+212"),
  dial("TN", "+216"),
  dial("DZ", "+213"),
  dial("IQ", "+964"),
  dial("PS", "+970"),
  dial("SY", "+963"),
  dial("TR", "+90"),
  dial("GB", "+44"),
  dial("US", "+1"),
  dial("FR", "+33"),
  dial("DE", "+49"),
  dial("IN", "+91"),
  dial("MY", "+60"),
];

const DEFAULT_DIAL_CODE = "+966";

export { DEFAULT_DIAL_CODE, DIAL_CODES };
export type { DialCode };
