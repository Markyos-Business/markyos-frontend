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
  /** The field around it is required, or busy checking. */
  required?: boolean;
  busy?: boolean;
  describedBy?: string;
  ref?: Ref<HTMLInputElement>;
};

/**
 * One arrow press on a segment: the next value on the step grid (min, min +
 * step, …, never past max), wrapping at the ends. From empty, Up starts at
 * min and Down at the last value on the grid. A value off the grid (a typed
 * 07 with a step of 5) moves to the grid value in that direction.
 */
function stepSegment(value: number | null, direction: 1 | -1, min: number, max: number, step: number): number {
  const count = Math.floor((max - min) / step) + 1;
  const last = min + (count - 1) * step;
  if (value === null) return direction === 1 ? min : last;
  const at = (value - min) / step;
  const index = direction === 1 ? Math.floor(at) + 1 : Math.ceil(at) - 1;
  return min + (((index % count) + count) % count) * step;
}

/**
 * One number in a time or a duration ("09" in 09:30): a spinbutton. Arrows
 * step it and wrap at the ends, typing replaces it (Arabic-Indic digits too)
 * and moves on once it's full, Backspace clears it. Left to right always, as
 * times are written.
 */
const SegmentInput = ({ label, value, onChange, min, max, step = 1, width = 2, onFilled, id, disabled, readOnly, invalid, required, busy, describedBy, ref }: SegmentInputProps) => {
  const [typing, setTyping] = useState<string | null>(null);
  const shown = typing ?? (value === null ? "" : String(value).padStart(width, "0"));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      setTyping(null);
      // Wrap around on the step grid: 55 → 00 and 00 → 55 for minutes in fives.
      onChange(stepSegment(value, e.key === "ArrowUp" ? 1 : -1, min, max, step));
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
      aria-required={required || undefined}
      aria-busy={busy || undefined}
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
          // Half-typed: show it, but only hand on a value the segment allows
          // ("0" of a 1–12 hour waits for its second digit).
          setTyping(digits);
          if (n >= min && n <= max) onChange(n);
        }
      }}
      onBlur={() => {
        // Left half-typed below the range: settle on the nearest allowed value.
        if (typing !== null && Number(typing) < min) onChange(min);
        setTyping(null);
      }}
      className="mk-field-control text-center tabular-nums"
      style={{ width: `${width + 1}ch`, flex: "none" }}
    />
  );
};

export { SegmentInput, stepSegment };
export type { SegmentInputProps };
