"use client";

import { useId } from "react";
import { MONO } from "../constants";

type SliderRowProps = { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (v: number) => void };

/** A labelled range with its value read out. The kit has no slider yet; this is the sandbox's own. */
export function SliderRow({ label, value, min, max, step, suffix, onChange }: SliderRowProps) {
  // Points the slider at the label already on screen rather than repeating it
  // in an aria-label, so the two can never drift apart.
  const labelId = useId();
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span id={labelId} className="text-[12px] font-medium text-text-muted">
          {label}
        </span>
        <span className={`text-[11px] text-text-faint ${MONO}`}>
          {value.toFixed(step < 1 ? 2 : 0)}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        aria-labelledby={labelId}
        aria-valuetext={`${value.toFixed(step < 1 ? 2 : 0)}${suffix}`}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--accent)]"
      />
    </div>
  );
}
