"use client";

import { useState } from "react";
import type { KeyboardEvent, Ref } from "react";
import { westernDigits } from "./date-utils";

type SegmentInputProps = {
  /** What it is, for screen readers: "Hour", "Minutes". */
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min: number;
  max: number;
  /** Arrow-key step. Default 1. */
  step?: number;
  /** Digits shown, zero-padded: 2 for "09". Default 2. */
  width?: number;
  /** Two digits typed: move to the next segment. */
  onFilled?: () => void;
  id?: string;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  describedBy?: string;
  ref?: Ref<HTMLInputElement>;
};

/**
 * One number in a time or a duration ("09" in 09:30): a spinbutton. Arrows
 * step it and wrap at the ends, typing replaces it (Arabic-Indic digits too)
 * and moves on once it's full, Backspace clears it. Left to right always, as
 * times are written.
 */
const SegmentInput = ({ label, value, onChange, min, max, step = 1, width = 2, onFilled, id, disabled, readOnly, invalid, describedBy, ref }: SegmentInputProps) => {
  const [typing, setTyping] = useState<string | null>(null);
  const shown = typing ?? (value === null ? "" : String(value).padStart(width, "0"));
  const span = max - min + step;

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      setTyping(null);
      const base = value ?? (e.key === "ArrowUp" ? min - step : max + step);
      const raw = base + (e.key === "ArrowUp" ? step : -step);
      // Wrap around: 59 → 00, 00 → 59.
      onChange(((((raw - min) % span) + span) % span) + min);
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(min);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(max);
    }
  };

  return (
    <input
      ref={ref}
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      role="spinbutton"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value ?? undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      disabled={disabled}
      readOnly={readOnly}
      dir="ltr"
      placeholder={"–".repeat(width)}
      value={shown}
      onKeyDown={onKeyDown}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const digits = westernDigits(e.target.value).replace(/\D/g, "").slice(-width);
        if (!digits) {
          setTyping(null);
          onChange(null);
          return;
        }
        const n = Number(digits);
        if (digits.length >= width || n * 10 > max) {
          // Full, or no second digit could still fit: take it and move on.
          setTyping(null);
          onChange(Math.min(max, Math.max(min, n)));
          onFilled?.();
        } else {
          setTyping(digits);
          onChange(n);
        }
      }}
      onBlur={() => setTyping(null)}
      className="mk-field-control text-center tabular-nums"
      style={{ width: `${width + 1}ch`, flex: "none" }}
    />
  );
};

export { SegmentInput };
export type { SegmentInputProps };
