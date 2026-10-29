import { EMAIL_RE } from "@/components/features/auth";

/** The invite dialog's email box: commas, spaces or new lines between, each once. */
export function parseEmails(text: string): { emails: string[]; invalid: string[] } {
  const all = [...new Set(text.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];
  return { emails: all.filter((e) => EMAIL_RE.test(e)), invalid: all.filter((e) => !EMAIL_RE.test(e)) };
}
