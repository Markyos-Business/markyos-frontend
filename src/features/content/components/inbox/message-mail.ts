import { CONTENT_COPY } from "../../copy";
import type { ContactMessage } from "../../types";

/**
 * A `mailto:` that answers a contact message: to its sender, with
 * "Re: <topic>" as the subject, in the language they asked to be answered in.
 */
export function replyHref(m: Pick<ContactMessage, "email" | "topic" | "replyLanguage" | "locale">): string {
  const lang = m.replyLanguage === "ar" || (!m.replyLanguage && m.locale === "ar") ? "ar" : "en";
  const topic = CONTENT_COPY[lang].messages.topics[m.topic] ?? m.topic;
  const subject = lang === "ar" ? `رد: ${topic}` : `Re: ${topic}`;
  return `mailto:${encodeURIComponent(m.email).replace(/%40/g, "@")}?subject=${encodeURIComponent(subject)}`;
}
