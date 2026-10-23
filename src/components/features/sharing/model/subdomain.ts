/**
 * What makes a subdomain usable.
 *
 * Shared between the field (which checks as you type) and the store action
 * (which checks again before writing), because a rule enforced only in the UI
 * is a rule that is not enforced.
 */

/**
 * Labels that must not be handed out.
 *
 * Two kinds: names the platform itself needs (`app`, `api`, `admin`) and names
 * that would let a link impersonate the platform to the person clicking it —
 * `login.markyos.app` and `billing.markyos.app` are exactly the addresses a
 * phishing page wants, and a brand guideline has no reason to want either.
 */
const RESERVED = new Set([
  "www", "app", "api", "admin", "dashboard", "cdn", "static", "assets", "mail", "smtp", "ftp",
  "login", "signin", "signup", "auth", "account", "accounts", "billing", "pay", "payment", "checkout",
  "support", "help", "status", "docs", "blog", "news", "about", "legal", "privacy", "terms",
  "markyos", "clients", "client", "test", "staging", "dev", "demo", "internal", "root", "system",
]);

export const SUBDOMAIN_MIN = 3;
export const SUBDOMAIN_MAX = 30;

/** An error message, or null when the label is fine. */
export function validateSubdomain(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (!v) return "Enter a subdomain.";
  if (v.length < SUBDOMAIN_MIN) return `At least ${SUBDOMAIN_MIN} characters.`;
  if (v.length > SUBDOMAIN_MAX) return `At most ${SUBDOMAIN_MAX} characters.`;
  if (!/^[a-z0-9-]+$/.test(v)) return "Letters, numbers and hyphens only.";
  if (v.startsWith("-") || v.endsWith("-")) return "Can't start or end with a hyphen.";
  if (v.includes("--")) return "No double hyphens.";
  // A label that is only digits reads as an IP fragment to some resolvers and
  // as a mistake to everyone else.
  if (/^\d+$/.test(v)) return "Needs at least one letter.";
  if (RESERVED.has(v)) return "That name is reserved.";
  return null;
}

/** The nearest legal subdomain to what someone typed, for the "suggest" path. */
export function suggestSubdomain(from: string): string {
  const base = from
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SUBDOMAIN_MAX);
  if (!base || base.length < SUBDOMAIN_MIN || /^\d+$/.test(base) || RESERVED.has(base)) return `${base || "brand"}-brand`.slice(0, SUBDOMAIN_MAX);
  return base;
}
