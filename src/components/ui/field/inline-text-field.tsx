"use client";

import { useState } from "react";
import { Icon } from "../icon";
import { fieldClasses } from "./input-field";

type InlineTextFieldProps = {
  /** The saved text. */
  value: string;
  /** Called with the trimmed new text, only when it changed and isn't empty. */
  onCommit: (next: string) => void;
  /** The field's accessible name, e.g. "Brand name". */
  label: string;
  /** The tooltip on the text, e.g. "Rename this brand". */
  title?: string;
  /** The text's size and weight, shared by the text and the field so nothing jumps. */
  textClassName?: string;
  /** Show the pen glyph after the text. Default true. */
  showIcon?: boolean;
  maxLength?: number;
  disabled?: boolean;
};

/**
 * A name edited in place: reads as text with a pen until clicked, then is the
 * compact underline field in the same type, so the line doesn't jump. Enter or
 * leaving the field saves; Escape puts the old text back. An empty or
 * unchanged name saves nothing.
 */
const InlineTextField = ({
  value,
  onCommit,
  label,
  title,
  textClassName = "text-body font-semibold",
  showIcon = true,
  maxLength,
  disabled = false,
}: InlineTextFieldProps) => {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const next = draft.trim();
    setDraft(null);
    if (next && next !== value) onCommit(next);
  };

  if (draft !== null) {
    return (
      <input
        autoFocus
        dir="auto"
        value={draft}
        maxLength={maxLength}
        aria-label={label}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            setDraft(null);
          }
        }}
        className={`${fieldClasses("sm")} bidi-auto min-w-0 flex-1 ${textClassName}`}
      />
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setDraft(value)}
      title={title ?? label}
      aria-label={`${label}: ${value}`}
      className="mk-tap inline-flex min-w-0 cursor-pointer items-center gap-space-2 text-start text-text disabled:cursor-default"
    >
      <span dir="auto" className={`bidi-auto truncate ${textClassName}`}>
        {value}
      </span>
      {showIcon && !disabled && <Icon name="pen" size={12} className="shrink-0 text-text-faint" />}
    </button>
  );
};

export { InlineTextField };
export type { InlineTextFieldProps };
