"use client";

import { useId, useImperativeHandle, useRef, useState } from "react";
import type { ClipboardEvent, FocusEvent, KeyboardEvent, Ref } from "react";
import { westernDigits } from "../date/date-utils";
import { useUiStrings } from "../ui-strings";
import { FieldNote, labelClasses } from "./input-field";

type OtpFieldProps = {
  label: string;
  /** The code so far, digits only. Controlled with `onChange`; or `defaultValue`. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** When focus leaves the whole code (not when it moves between boxes). */
  onBlur?: () => void;
  /** Submitted with a native form, as the digits. */
  name?: string;
  /** 4 to 6 digits. Default 6. */
  length?: number;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  /** `focus()` goes to the first empty box: what `Controller` calls on an error. */
  ref?: Ref<{ focus: () => void }>;
  /** Each box's name, e.g. "Digit 2 of 6". Default from the kit's words. */
  digitLabel?: (index: number, length: number) => string;
};

const toCells = (code: string, length: number) => Array.from({ length }, (_, i) => code[i] ?? "");

/**
 * A one-time code, one box per digit: typing moves on, Backspace clears the
 * box (or the one before, if empty) and moves back, the arrows move, and
 * pasting a whole code fills every box. Arabic-Indic digits are read as
 * digits. The boxes stay left to right in Arabic too, because that is how a
 * code is read and typed everywhere.
 *
 * Each box keeps its place: clearing the third digit leaves a gap there
 * rather than shifting the rest. The value handed on is the digits in order.
 */
const OtpField = ({ label, value, defaultValue = "", onChange, onBlur, name, length = 6, required = true, disabled = false, readOnly = false, error, ref, digitLabel }: OtpFieldProps) => {
  const { t } = useUiStrings();
  const id = useId();
  const noteId = `${id}-note`;
  const [cells, setCells] = useState(() => toCells(value ?? defaultValue, length));
  // A code set from outside (a reset, a resend) replaces the boxes; our own
  // emits come back as the same digits and leave the gaps where they are.
  const [seen, setSeen] = useState(value);
  if (value !== undefined && value !== seen) {
    setSeen(value);
    if (value !== cells.join("")) setCells(toCells(value, length));
  }
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const focus = (i: number) => inputs.current[i]?.focus();
  useImperativeHandle(ref, () => ({ focus: () => focus(Math.max(0, cells.findIndex((c) => !c))) }), [cells]);
  const locked = disabled || readOnly;

  const commit = (next: string[]) => {
    setCells(next);
    onChange?.(next.join(""));
  };

  const handleChange = (i: number, raw: string) => {
    if (locked) return;
    const digit = westernDigits(raw).replace(/\D/g, "").slice(-1);
    const next = [...cells];
    next[i] = digit;
    commit(next);
    if (digit && i < length - 1) focus(i + 1);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      // Ours, not the browser's: it would clear the box we just moved to.
      e.preventDefault();
      if (locked) return;
      const next = [...cells];
      if (cells[i]) next[i] = "";
      else if (i > 0) {
        next[i - 1] = "";
        focus(i - 1);
      }
      commit(next);
    } else if (e.key === "ArrowLeft" && i > 0) focus(i - 1);
    else if (e.key === "ArrowRight" && i < length - 1) focus(i + 1);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (locked) return;
    const pasted = westernDigits(e.clipboardData.getData("text")).replace(/\D/g, "").slice(0, length);
    commit(toCells(pasted, length));
    focus(Math.min(pasted.length, length - 1));
  };

  return (
    <fieldset
      disabled={disabled}
      className="flex w-full flex-col gap-space-2"
      aria-describedby={error ? noteId : undefined}
      onBlur={(e: FocusEvent<HTMLFieldSetElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onBlur?.();
      }}
    >
      <legend className={labelClasses}>
        {label}
        {required && (
          <span aria-hidden className="ms-0.5 text-danger">
            *
          </span>
        )}
      </legend>
      <div dir="ltr" className="mt-space-2 flex gap-space-5">
        {cells.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={(digitLabel ?? t.digitOf)(i + 1, length)}
            aria-required={required || undefined}
            aria-invalid={error ? true : undefined}
            readOnly={readOnly}
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            // One underline per digit, the field's only shape (spec §6.5).
            className="mk-field w-full px-0 text-center font-mono text-h3 font-medium"
          />
        ))}
      </div>
      {name && <input type="hidden" name={name} value={cells.join("")} />}
      <FieldNote id={noteId} error={error} />
    </fieldset>
  );
};

/** OtpInput, by the UI library's name. */
const OtpInput = OtpField;

export { OtpField, OtpInput };
export type { OtpFieldProps };
