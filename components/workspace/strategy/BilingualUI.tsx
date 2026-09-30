"use client";

import { Icon } from "@/components/Icon";
import { RichText, richIsEmpty, richToPlainText } from "@/components/RichText";

/**
 * Small shared pieces for editing the strategy in two languages.
 */

/** Marks a field the machine wrote and nobody has read yet. */
export function MachineDraftFlag({ isAr }: { isAr: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 self-start text-[11px] font-semibold px-2 py-1 rounded-full mk-fade-in"
      style={{ background: "var(--warning-soft, rgba(255,176,32,.14))", color: "var(--warning)" }}
    >
      <Icon name="language" size={11} />
      {isAr ? "مسودة آلية — راجعها" : "Machine draft — review"}
    </span>
  );
}

/**
 * The other language's version of the same field, for reference while writing.
 *
 * Translating without the source in view means switching tabs to re-read a
 * sentence, then switching back having half-forgotten it. Showing it inline is
 * the difference between translating and remembering.
 *
 * Collapsed by default to a single line so it never competes with the field
 * being written — it's a reference, not content.
 */
export function OtherCopyHint({ text, rich = true, label }: { text: string; rich?: boolean; label?: string }) {
  const empty = rich ? richIsEmpty(text) : !text.trim();
  if (empty) return null;
  const preview = rich ? richToPlainText(text) : text;

  return (
    <details className="group rounded-lg overflow-hidden" style={{ background: "var(--surface-1)" }}>
      <summary
        className="flex items-center gap-2 px-3 py-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-[11.5px]"
        style={{ color: "var(--text-faint)" }}
      >
        <Icon name="language" size={11} />
        <span className="font-semibold shrink-0">{label ?? "English"}</span>
        <span dir="auto" className="flex-1 min-w-0 truncate bidi-auto">{preview}</span>
        <Icon
          name="angle-down"
          size={11}
          className="shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="px-3 pb-3 pt-1 text-[13px] leading-[1.6]" style={{ color: "var(--text-secondary)" }}>
        {rich ? <RichText value={text} /> : <p dir="auto" className="bidi-auto whitespace-pre-wrap">{text}</p>}
      </div>
    </details>
  );
}
