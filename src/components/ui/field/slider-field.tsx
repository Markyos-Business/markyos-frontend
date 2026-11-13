"use client";

import { useId } from "react";
import type { ReactNode } from "react";

type SliderFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** What the value reads as, shown beside the label and announced, e.g. "120%" or "Auto". */
  valueText?: string;
  /** Accent the value text, e.g. when it differs from the default. */
  valueActive?: boolean;
  /** Beside the label, e.g. an "overridden" dot. */
  labelExtra?: ReactNode;
  /** Keep the label for screen readers only, when a heading above already says it. */
  hideLabel?: boolean;
  disabled?: boolean;
  /** Labelled points under the track: 0%, 50%, 100%. */
  marks?: { value: number; label: string }[];
  hint?: string;
};

/**
 * A labelled slider: the label and its value on one line, the track under it
 * in the accent colour. The label is tied to the slider and the value text is
 * what a screen reader announces, so the two can never drift apart.
 */
const SliderField = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  valueText,
  valueActive = false,
  labelExtra,
  hideLabel = false,
  disabled = false,
  marks,
  hint,
}: SliderFieldProps) => {
  const labelId = useId();
  const shown = valueText ?? value.toFixed(step < 1 ? 2 : 0);
  return (
    <div className="flex w-full flex-col gap-space-1">
      <div className={`flex items-center justify-between gap-space-3 ${hideLabel ? "sr-only" : ""}`}>
        <span id={labelId} className="flex items-center gap-space-2 text-caption font-medium text-text-muted">
          {label}
          {labelExtra}
        </span>
        <span className={`font-mono text-caption ${valueActive ? "text-accent-text" : "text-text-faint"}`}>{shown}</span>
      </div>
      <input
        type="range"
        aria-labelledby={labelId}
        aria-valuetext={shown}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-describedby={hint ? `${labelId}-hint` : undefined}
        className="w-full cursor-pointer accent-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
      />
      {marks && (
        // Each mark sits under its value; the row mirrors with the slider.
        <div aria-hidden className="relative h-4 text-ui-2xs text-text-faint">
          {marks.map((m) => (
            <span key={m.value} className="absolute -translate-x-1/2 rtl:translate-x-1/2" style={{ insetInlineStart: `${((m.value - min) / (max - min)) * 100}%` }}>
              {m.label}
            </span>
          ))}
        </div>
      )}
      {hint && (
        <span id={`${labelId}-hint`} className="text-caption text-text-faint">
          {hint}
        </span>
      )}
    </div>
  );
};

/** Slider, by the UI library's name. */
const Slider = SliderField;

export { Slider, SliderField };
export type { SliderFieldProps };
