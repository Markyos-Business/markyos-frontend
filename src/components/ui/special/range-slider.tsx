"use client";

import { useId } from "react";
import { labelClasses } from "../field/input-field";
import { useUiStrings } from "../ui-strings";

type RangeSliderProps = {
  label: string;
  /** [low, high]. */
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min: number;
  max: number;
  step?: number;
  /** How a value reads: "SAR 84,500". Shown and announced. */
  format?: (value: number) => string;
  /** The least the two ends may be apart. Default 0. */
  minGap?: number;
  disabled?: boolean;
  hint?: string;
  strings?: { minimum?: string; maximum?: string };
};

/**
 * A span between two values: two real range inputs on one track, each a
 * slider for the keyboard and screen readers ("Budget, minimum, SAR 20,000").
 * The ends can't cross; the track between them fills with the accent. The
 * fill follows the reading direction.
 */
const RangeSlider = ({ label, value, onChange, min, max, step = 1, format = String, minGap = 0, disabled = false, hint, strings }: RangeSliderProps) => {
  const { t } = useUiStrings();
  const id = useId();
  const [lo, hi] = value;
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const minName = strings?.minimum ?? t.minimum;
  const maxName = strings?.maximum ?? t.maximum;

  return (
    <div role="group" aria-labelledby={`${id}-label`} aria-describedby={hint ? `${id}-hint` : undefined} className="flex w-full flex-col gap-space-2">
      <div className="flex items-center justify-between gap-space-3">
        <span id={`${id}-label`} className={labelClasses}>
          {label}
        </span>
        <span dir="ltr" className="text-caption font-medium tabular-nums text-text-muted">
          {format(lo)} – {format(hi)}
        </span>
      </div>
      <div className="relative mx-space-3 h-6">
        <div aria-hidden className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-ink-soft">
          <div className={`absolute h-full rounded-full ${disabled ? "bg-text-disabled" : "bg-accent"}`} style={{ insetInlineStart: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }} />
        </div>
        <input
          type="range"
          aria-label={`${label}, ${minName}`}
          aria-valuetext={format(lo)}
          min={min}
          max={max}
          step={step}
          value={lo}
          disabled={disabled}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi - minGap), hi])}
          className="mk-range"
        />
        <input
          type="range"
          aria-label={`${label}, ${maxName}`}
          aria-valuetext={format(hi)}
          min={min}
          max={max}
          step={step}
          value={hi}
          disabled={disabled}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + minGap)])}
          className="mk-range"
        />
      </div>
      {hint && (
        <span id={`${id}-hint`} className="px-space-5 text-caption text-text-faint">
          {hint}
        </span>
      )}
    </div>
  );
};

export { RangeSlider };
export type { RangeSliderProps };
