"use client";

import { MONO, WEIGHTS } from "../constants";

/** The five weights to try, the chosen one in solid ink. */
export function WeightPicker({ weight, onWeight }: { weight: number; onWeight: (w: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-text-muted">Weight</span>
      <div className="flex gap-1.5">
        {WEIGHTS.map((w) => (
          <button
            key={w}
            type="button"
            aria-pressed={weight === w}
            onClick={() => onWeight(w)}
            className={`h-8 flex-1 cursor-pointer rounded-md text-[12px] font-medium ${MONO} ${
              weight === w ? "bg-solid text-solid-ink" : "bg-surface-2 text-text-muted"
            }`}
          >
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}
