"use client";

import { useId, useRef } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { FieldNote, labelClasses } from "../fields/InputField";

type OtpFieldProps = {
  label: string;
  /** The code so far, digits only. */
  value: string;
  onChange: (value: string) => void;
  length?: number;
  required?: boolean;
  error?: string;
};

/**
 * A one-time code, one box per digit: typing moves on, Backspace moves back,
 * and pasting a whole code fills every box. The boxes stay left to right in
 * Arabic too, because that is how a code is read and typed everywhere.
 */
const OtpField = ({ label, value, onChange, length = 6, required = true, error }: OtpFieldProps) => {
  const id = useId();
  const noteId = `${id}-note`;
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const focus = (i: number) => inputs.current[i]?.focus();
  const commit = (next: string[]) => onChange(next.join(""));

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = digit;
    commit(next);
    if (digit && i < length - 1) focus(i + 1);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const next = [...digits];
      if (digits[i]) next[i] = "";
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
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    commit(Array.from({ length }, (_, i) => pasted[i] ?? ""));
    focus(Math.min(pasted.length, length - 1));
  };

  return (
    <fieldset className="flex w-full flex-col gap-space-2" aria-describedby={error ? noteId : undefined}>
      <legend className={labelClasses}>
        {label}
        {required && (
          <span aria-hidden className="ms-0.5 text-danger">
            *
          </span>
        )}
      </legend>
      <div dir="ltr" className="mt-space-2 flex gap-space-5">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${i + 1} of ${length}`}
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            // One underline per digit, the field's only shape (spec §6.5).
            aria-invalid={error ? true : undefined}
            className="mk-underline w-full px-0 text-center font-mono text-h3 font-medium"
          />
        ))}
      </div>
      <FieldNote id={noteId} error={error} />
    </fieldset>
  );
};

export { OtpField };
export type { OtpFieldProps };
