"use client";

import { useId, useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { EMAIL_RE } from "@/lib/emailList";
import { Icon } from "../../ui/primitives/Icon";
import { FieldLabel, FieldNote, inputClasses } from "../fields/InputField";

type EmailChipsFieldProps = {
  label: string;
  /** The addresses so far, lower-cased, each once. */
  value: readonly string[];
  onChange: (emails: string[]) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** The accessible name of each chip's remove button, e.g. `Remove ${email}`. */
  removeLabel?: (email: string) => string;
};

/** Split pasted or typed text into addresses: commas, semicolons, spaces or new lines between. */
const split = (text: string) => text.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean);

/**
 * Several email addresses in one field box: each becomes a chip as soon as it
 * is finished (a comma, space, semicolon, Enter, Tab with text, leaving the
 * field, or a pasted list). Backspace in the empty box takes the last chip
 * back for editing. A malformed address stays as a danger chip, so the person
 * sees which one to fix rather than a message about "one of them".
 *
 * Addresses always run left to right, also in Arabic.
 */
const EmailChipsField = ({
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
  required,
  disabled,
  autoFocus,
  removeLabel = (email) => `Remove ${email}`,
}: EmailChipsFieldProps) => {
  const id = `ec-${useId()}`;
  const noteId = `${id}-note`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");

  const add = (text: string) => {
    const next = [...value];
    for (const email of split(text)) if (!next.includes(email)) next.push(email);
    if (next.length !== value.length) onChange(next);
    setDraft("");
  };

  const remove = (email: string) => {
    onChange(value.filter((e) => e !== email));
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === "," || e.key === ";" || e.key === " ") && draft.trim()) {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Enter") {
      // An empty Enter submits the form, as in any other field.
    } else if (e.key === "Tab" && draft.trim()) {
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      e.preventDefault();
      const last = value[value.length - 1];
      onChange(value.slice(0, -1));
      setDraft(last);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (/[\s,;]/.test(text.trim())) {
      e.preventDefault();
      add(`${draft} ${text}`);
    }
  };

  return (
    <div className="flex min-h-field w-full flex-col gap-space-2">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <div
        dir="ltr"
        // The whole box is the field: a click anywhere in it types.
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            inputRef.current?.focus();
          }
        }}
        className={`${inputClasses} flex cursor-text flex-wrap items-center gap-space-2 py-space-2`}
      >
        {value.map((email) => {
          const bad = !EMAIL_RE.test(email);
          return (
            <span
              key={email}
              className={`inline-flex h-7 max-w-full items-center gap-space-1 rounded-md ps-space-3 pe-space-1 text-caption font-medium ${
                bad ? "bg-danger-soft text-danger" : "bg-surface-2 text-text shadow-edge"
              }`}
            >
              <span className="truncate">{email}</span>
              <button
                type="button"
                disabled={disabled}
                aria-label={removeLabel(email)}
                onClick={() => remove(email)}
                className="mk-icon-btn flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-text-muted"
              >
                <Icon name="times" size={12} />
              </button>
            </span>
          );
        })}
        <input
          ref={inputRef}
          id={id}
          type="email"
          inputMode="email"
          autoComplete="off"
          autoFocus={autoFocus}
          disabled={disabled}
          value={draft}
          placeholder={value.length ? undefined : placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ?? hint ? noteId : undefined}
          aria-required={required || undefined}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={() => draft.trim() && add(draft)}
          className="h-7 min-w-40 flex-1 bg-transparent text-body font-medium text-text outline-none placeholder:font-normal placeholder:text-text-disabled"
        />
      </div>
      <FieldNote id={noteId} error={error} hint={hint} />
    </div>
  );
};

export { EmailChipsField };
export type { EmailChipsFieldProps };
