"use client";

import { Icon } from "../icon";
import { pillSegment, pillSegmentStyle, pillTrack, pillTrackStyle } from "./pill-segments";
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
  disabled?: boolean;
};

/**
 * Two modes for one form ("pick from the list" or "type it in"). Not an
 * on/off switch: both sides are named choices. Drawn like every "choose one"
 * control (pill-segments).
 */
const SegmentedToggle = ({ label, off, on, value, onChange, disabled }: SegmentedToggleProps) => {
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
        disabled={disabled}
        className={`${pillSegment(!seg.label)} flex-1`}
        style={pillSegmentStyle(active)}
      >
        {seg.icon && <Icon name={seg.icon} size={16} />}
        {seg.label}
      </button>
    );
  };
  return (
    <div ref={group} role="radiogroup" aria-label={label} className={pillTrack} style={pillTrackStyle}>
      {segment(off, false)}
      {segment(on, true)}
    </div>
  );
};

export { SegmentedToggle };
export type { SegmentedToggleProps };
