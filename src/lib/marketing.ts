/** The public website, markyos.com (overridable per environment). */
export const MARKETING_URL = (process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://markyos.com").replace(/\/+$/, "");

/**
 * A page on the website in the reader's language. Arabic is served from the
 * root and English under /en, so "/privacy" is /privacy or /en/privacy.
 */
export const marketingHref = (path: string, lang: "en" | "ar") =>
  `${MARKETING_URL}${lang === "en" ? "/en" : ""}${path === "/" ? "" : path}` || MARKETING_URL;
