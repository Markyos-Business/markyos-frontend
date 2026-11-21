"use client";

import { useState } from "react";
import { AutoTextarea } from "@/components/ui";
import { InputField } from "@/components/ui";

/**
 * Click-to-edit plain text, sized to its content.
 *
 * The strategy's lists were add-and-delete only: fixing one word in a persona
 * meant deleting the card and retyping it, and writing its Arabic was
 * impossible. Editing in place is what makes a second language practical —
 * you are always amending something that already exists.
 *
 * Commits on blur rather than per keystroke, so one edit is one undo step and
 * one "unpublished changes" mark, not one per letter.
 */
export function InlineText({
  value,
  onCommit,
  placeholder,
  isAr = false,
  multiline = false,
  className = "",
  style,
}: {
  value: string;
  onCommit: (next: string) => void;
  placeholder: string;
  isAr?: boolean;
  multiline?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  function commit() {
    if (draft !== null && draft.trim() !== value.trim()) onCommit(draft.trim());
    setDraft(null);
  }

  if (draft !== null) {
    const shared = {
      value: draft,
      onBlur: commit,
      placeholder,
      // The kit's compact field while editing (MARKYOS_UI §2.6), like
      // InlineTextField: the same underline and corner as every other field.
      className: `mk-field mk-field-sm w-full bidi-auto ${className}`,
      style,
    };
    return multiline ? (
      <AutoTextarea {...shared} onChange={setDraft} autoFocus />
    ) : (
      <input
        {...shared}
        autoFocus
        dir="auto"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setDraft(null);
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setDraft(value)}
      dir="auto"
      title={isAr ? "اضغط للتعديل" : "Click to edit"}
      className={`text-start cursor-text rounded-md px-1.5 py-1 -mx-1.5 transition-colors hover:bg-surface-1 bidi-auto ${className}`}
      style={style}
    >
      {value || <span style={{ color: "var(--text-faint)" }}>{placeholder}</span>}
    </button>
  );
}

export function MiniInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <InputField size="sm" aria-label={placeholder} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  );
}
