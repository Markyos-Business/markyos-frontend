"use client";

import { Icon } from "../icon";
import { useRadioNavigation } from "./use-radio-navigation";

type Segment = { label: string; icon?: string };

type SegmentedToggleProps = {
  /** The pair's accessible name. */
  label: string;
  /** Chosen when `value` is false. Sits on the reading-start side. */
  off: Segment;
  /** Chosen when `value` is true. Sits on the reading-end side. */
  on: Segment;
  value: boolean;
  onChange: (value: boolean) => void;
};

/**
 * Two modes for one form ("pick from the list" or "type it in"). Not an
 * on/off switch: both sides are named choices. Drawn like text tabs (spec
 * §6.11): the chosen side is a raised pill with a hairline.
 */
const SegmentedToggle = ({ label, off, on, value, onChange }: SegmentedToggleProps) => {
  // One Tab stop, arrow keys between the two sides (mirrored in Arabic).
  const { group, radioProps } = useRadioNavigation({
    items: [{ value: "off" }, { value: "on" }],
    value: value ? "on" : "off",
    onChange: (v) => onChange(v === "on"),
  });
  const segment = (seg: Segment, segValue: boolean) => {
    const active = value === segValue;
    return (
      <button
        type="button"
        {...radioProps({ value: segValue ? "on" : "off" })}
        onClick={() => onChange(segValue)}
        className={`flex h-8 flex-1 items-center justify-center gap-space-3 whitespace-nowrap rounded-md px-space-5 text-caption font-medium transition-[background-color,color,box-shadow] ${
          active ? "bg-surface-2 text-text shadow-edge" : "text-text-muted hover:text-text"
        }`}
      >
        {seg.icon && <Icon name={seg.icon} size={16} />}
        {seg.label}
      </button>
    );
  };
  return (
    <div ref={group} role="radiogroup" aria-label={label} className="inline-flex h-control-sm items-center rounded-lg bg-surface-sunken p-1 shadow-edge-soft">
      {segment(off, false)}
      {segment(on, true)}
    </div>
  );
};

export { SegmentedToggle };
export type { SegmentedToggleProps };
