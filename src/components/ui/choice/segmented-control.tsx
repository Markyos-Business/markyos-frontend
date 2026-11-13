"use client";

import { Icon } from "../icon";
import { useRadioNavigation } from "./use-radio-navigation";

type Segment<V extends string> = { value: V; label: string; icon?: string; disabled?: boolean };

type SegmentedControlProps<V extends string> = {
  /** The group's accessible name. */
  label: string;
  options: readonly Segment<V>[];
  value: V;
  onChange: (value: V) => void;
  /** `sm` for a toolbar. Default `md`. */
  size?: "sm" | "md";
  /** Stretch to the row and share it evenly. */
  fullWidth?: boolean;
};

/**
 * Two to five named views or modes of one thing ("Day · Week · Month"), drawn
 * like text tabs (spec §6.11): the chosen segment is a raised pill with a
 * hairline. It's a radio group: one Tab stop, the arrow keys move the choice
 * and mirror in Arabic, Home and End jump to the ends. For on/off, use Switch.
 */
const SegmentedControl = <V extends string>({ label, options, value, onChange, size = "md", fullWidth = false }: SegmentedControlProps<V>) => {
  const { group, radioProps } = useRadioNavigation({ items: options, value, onChange });
  return (
    <div
      ref={group}
      role="radiogroup"
      aria-label={label}
      className={`${fullWidth ? "flex w-full" : "inline-flex"} ${size === "sm" ? "h-8" : "h-control-sm"} items-center gap-0.5 rounded-lg bg-surface-sunken p-1 shadow-edge-soft`}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            {...radioProps(o)}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={`flex h-full flex-1 items-center justify-center gap-space-3 whitespace-nowrap rounded-md px-space-5 text-caption font-medium transition-[background-color,color,box-shadow] disabled:cursor-not-allowed disabled:text-text-disabled ${
              active ? "bg-surface-2 text-text shadow-edge" : "text-text-muted hover:text-text"
            }`}
          >
            {o.icon && <Icon name={o.icon} size={16} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
};

export { SegmentedControl };
export type { Segment, SegmentedControlProps };
