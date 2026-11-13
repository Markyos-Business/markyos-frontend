"use client";

import { useTabNavigation } from "@/components/ui";
import { tabButtonId } from "@/components/ui";

type SegmentsProps<T extends string | number> = {
  options: readonly { value: T; label: string; disabled?: boolean }[];
  value: T;
  onChange: (value: T) => void;
  /** Tabs over a panel (role="tablist"), rather than a setting. */
  /** The label size, which differs by how much room the row has. */
  textClass: string;
} & ({ asTabs: true; label: string; id: string; panelId: string } | { asTabs?: false; label?: never; id?: never; panelId?: never });

/** A full-width row of pill segments on a sunken track: the panel's tabs and its small either-or settings. */
export function Segments<T extends string | number>({ options, value, onChange, asTabs, textClass, label, id, panelId }: SegmentsProps<T>) {
  const navigation = useTabNavigation({ tabs: options.map((option) => ({ key: option.value, disabled: option.disabled })), active: value, onChange });
  return (
    <div ref={asTabs ? navigation.row : undefined} id={id} className="flex shrink-0 rounded-full bg-surface-1 p-0.5" role={asTabs ? "tablist" : undefined} aria-label={label} aria-orientation={asTabs ? "horizontal" : undefined}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role={asTabs ? "tab" : undefined}
          id={asTabs ? tabButtonId(id, o.value) : undefined}
          aria-controls={asTabs ? panelId : undefined}
          aria-selected={asTabs ? value === o.value && !o.disabled : undefined}
          disabled={o.disabled}
          {...(asTabs ? navigation.tabProps(o.value) : {})}
          onClick={() => onChange(o.value)}
          className={`h-8 flex-1 cursor-pointer rounded-full font-semibold ${textClass} ${value === o.value ? "bg-surface-2 text-text" : "text-text-faint"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
