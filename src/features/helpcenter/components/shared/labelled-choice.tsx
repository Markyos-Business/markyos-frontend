"use client";

import { useId } from "react";
import { SegmentedControl } from "@/components/ui";

type Option<V extends string> = { value: V; label: string };

/**
 * A choose-one pill with its label shown above it, like every other field in
 * the form (the kit control names itself for screen readers only).
 */
export function LabelledChoice<V extends string>({ label, value, options, onChange, disabled = false }: { label: string; value: V; options: Option<V>[]; onChange: (value: V) => void; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-field-label">
      <span id={id} className="text-caption text-text-muted">{label}</span>
      <SegmentedControl<V> label={label} value={value} options={options.map((o) => ({ ...o, disabled: disabled && o.value !== value }))} onChange={onChange} />
    </div>
  );
}
