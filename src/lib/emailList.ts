/** Good enough to catch typos; the server has the final say. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** An invite box of emails: commas, spaces or new lines between, each once. */
export function parseEmails(text: string): { emails: string[]; invalid: string[] } {
  const all = [...new Set(text.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];
  return { emails: all.filter((e) => EMAIL_RE.test(e)), invalid: all.filter((e) => !EMAIL_RE.test(e)) };
}
