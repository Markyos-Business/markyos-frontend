export const PAGE_SECTION = { en: "Settings", ar: "الإعدادات" } as const;

/**
 * Settings whose controls exist but whose service doesn't yet: the
 * `.markyos.app` subdomain and custom domains (nothing serves them; the
 * guideline lives at /v/<slug>) and developer settings (no API accepts the
 * key, nothing sends to the webhook). Hidden unless this flag is set, so no
 * one relies on them before they work. The stored values are untouched.
 */
export const SHOW_UNFINISHED_SETTINGS = process.env.NEXT_PUBLIC_UNFINISHED_SETTINGS === "1";
