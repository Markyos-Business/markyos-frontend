"use client";

import { useEffect, useState } from "react";
import { Icon } from "../icon";
import { useUiStrings } from "../ui-strings";
import { fieldClasses } from "./input-field";

type InlineTextFieldProps = {
  /** The saved text. */
  value: string;
  /**
   * Called with the trimmed new text, only when it changed and isn't empty.
   * Return a promise to show saving, then saved; a rejection shows the error
   * and keeps the text being edited, so Enter tries again.
   */
  onCommit: (next: string) => void | Promise<void>;
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
  strings?: { saving?: string; saved?: string; failed?: string };
};

type Status = "idle" | "saving" | "saved" | "failed";

/**
 * A name edited in place (InlineEdit): reads as text with a pen until
 * clicked (or Enter on it), then is the compact underline field in the same
 * type, so the line doesn't jump. Enter or leaving saves; Escape puts the
 * old text back. An empty or unchanged name saves nothing.
 *
 * An async save shows the new text with a spinner while it runs (aria-busy),
 * a tick and "Saved." for two seconds after, or "Couldn't save. Try again."
 * with the edit still open. Each is announced politely; the failure as an
 * alert.
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
  strings,
}: InlineTextFieldProps) => {
  const { t } = useUiStrings();
  const [draft, setDraft] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  // What's on screen while a save runs: the new text, not the old value.
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "saved") return;
    const timer = window.setTimeout(() => setStatus("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [status]);

  const commit = async () => {
    if (draft === null || status === "saving") return;
    const next = draft.trim();
    if (!next || next === value) {
      setDraft(null);
      setStatus("idle");
      return;
    }
    const result = onCommit(next);
    if (!(result instanceof Promise)) {
      setDraft(null);
      return;
    }
    setDraft(null);
    setPending(next);
    setStatus("saving");
    try {
      await result;
      setStatus("saved");
    } catch {
      // Back to editing what they typed, so Enter tries again.
      setDraft(next);
      setStatus("failed");
    } finally {
      setPending(null);
    }
  };

  const note =
    status === "failed" ? (
      <span role="alert" className="text-caption text-danger">
        {strings?.failed ?? t.form.inlineFailed}
      </span>
    ) : (
      <span role="status" className={status === "saved" ? "inline-flex items-center gap-space-1 text-caption text-success" : "sr-only"}>
        {status === "saved" && <Icon name="check" size={16} />}
        {status === "saved" ? (strings?.saved ?? t.form.inlineSaved) : status === "saving" ? (strings?.saving ?? t.saving) : ""}
      </span>
    );

  if (draft !== null) {
    return (
      <span className="flex min-w-0 flex-1 flex-col gap-space-1">
        <input
          autoFocus
          dir="auto"
          value={draft}
          maxLength={maxLength}
          aria-label={label}
          aria-invalid={status === "failed" || undefined}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={() => void commit()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void commit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              setDraft(null);
              setStatus("idle");
            }
          }}
          className={`${fieldClasses("sm")} bidi-auto min-w-0 flex-1 ${textClassName}`}
        />
        {note}
      </span>
    );
  }

  const saving = status === "saving";
  return (
    <span className="inline-flex min-w-0 items-center gap-space-3">
      <button
        type="button"
        disabled={disabled || saving}
        aria-busy={saving || undefined}
        onClick={() => setDraft(pending ?? value)}
        title={title ?? label}
        aria-label={`${label}: ${pending ?? value}`}
        className="mk-tap inline-flex min-w-0 cursor-pointer items-center gap-space-2 text-start text-text disabled:cursor-default"
      >
        <span dir="auto" className={`bidi-auto truncate ${textClassName}`}>
          {pending ?? value}
        </span>
        {saving ? <Icon name="circle-notch" size={16} className="shrink-0 animate-spin text-text-muted" /> : showIcon && !disabled && <Icon name="pen" size={16} className="shrink-0 text-text-faint" />}
      </button>
      {note}
    </span>
  );
};

/** InlineEdit, by the UI library's name. */
const InlineEdit = InlineTextField;

export { InlineEdit, InlineTextField };
export type { InlineTextFieldProps, InlineTextFieldProps as InlineEditProps };
