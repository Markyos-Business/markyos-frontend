"use client";

import { Icon } from "../icon";
import { pillSegment, pillSegmentStyle, pillTrack, pillTrackStyle } from "./pill-segments";
import { useRadioNavigation } from "./use-radio-navigation";

type Segment<V extends string> = { value: V; label: string; icon?: string; disabled?: boolean };

type SegmentedControlProps<V extends string> = {
  /** The group's accessible name. */
  label: string;
  options: readonly Segment<V>[];
  value: V;
  onChange: (value: V) => void;
  /** Stretch to the row and share it evenly. */
  fullWidth?: boolean;
};

/**
 * Two to five named views or modes of one thing ("Day · Week · Month"), drawn
 * like every "choose one" control (pill-segments). It's a radio group: one Tab stop, the arrow keys move the choice
 * and mirror in Arabic, Home and End jump to the ends. For on/off, use Switch.
 */
const SegmentedControl = <V extends string>({ label, options, value, onChange, fullWidth = false }: SegmentedControlProps<V>) => {
  const { group, radioProps } = useRadioNavigation({ items: options, value, onChange });
  return (
    <div
      ref={group}
      role="radiogroup"
      aria-label={label}
      className={`${pillTrack} ${fullWidth ? "flex w-full" : ""}`}
      style={pillTrackStyle}
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
            className={`${pillSegment(!o.label)} flex-1`}
            style={pillSegmentStyle(active)}
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
