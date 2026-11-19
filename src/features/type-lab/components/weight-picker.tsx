"use client";

import { SegmentedControl } from "@/components/ui";
import { WEIGHTS } from "../constants";

/** The five weights to try, as one "choose one" control. */
export function WeightPicker({ weight, onWeight, label }: { weight: number; onWeight: (w: number) => void; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-text-muted">{label}</span>
      <SegmentedControl
        label={label}
        fullWidth
        options={WEIGHTS.map((w) => ({ value: String(w), label: String(w) }))}
        value={String(weight)}
        onChange={(w) => onWeight(Number(w))}
      />
    </div>
  );
}
