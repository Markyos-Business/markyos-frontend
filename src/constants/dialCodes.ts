/**
 * International dialling codes offered by the phone field, Gulf and the wider
 * Arab region first (where most Markyos studios and their clients are), then
 * a short list of common others. Extend as studios ask; the field accepts any
 * of these and validates nothing beyond digits.
 */
type DialCode = { code: string; label: string };

const DIAL_CODES: readonly DialCode[] = [
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+966", label: "🇸🇦 +966" },
  { code: "+974", label: "🇶🇦 +974" },
  { code: "+965", label: "🇰🇼 +965" },
  { code: "+973", label: "🇧🇭 +973" },
  { code: "+968", label: "🇴🇲 +968" },
  { code: "+962", label: "🇯🇴 +962" },
  { code: "+961", label: "🇱🇧 +961" },
  { code: "+20", label: "🇪🇬 +20" },
  { code: "+212", label: "🇲🇦 +212" },
  { code: "+216", label: "🇹🇳 +216" },
  { code: "+213", label: "🇩🇿 +213" },
  { code: "+964", label: "🇮🇶 +964" },
  { code: "+970", label: "🇵🇸 +970" },
  { code: "+963", label: "🇸🇾 +963" },
  { code: "+90", label: "🇹🇷 +90" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+49", label: "🇩🇪 +49" },
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+60", label: "🇲🇾 +60" },
];

export { DIAL_CODES };
export type { DialCode };
