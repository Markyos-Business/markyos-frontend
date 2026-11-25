import type { CSSProperties } from "react";

/**
 * The one look for every "choose one" control: mode, language, Edit/Read,
 * canvas width, All/Unread. Shaped like the buttons it sits beside (decided
 * 25 Nov 2026, replacing the round pills of 20 Nov): the track takes a
 * secondary button's fill, hairline edge and 8px control corner, the segments
 * a 6px corner, so Share · Edit/Read · More read as one row. The chosen
 * segment is raised on the card surface and takes the accent.
 *
 * On/off is a different control (Switch). Colours are set inline because the
 * kit's base styles for buttons win over a utility class on some of them, and
 * a control that paints its chosen side differently from its neighbour is the
 * inconsistency this file exists to prevent.
 */
const pillTrack = "inline-flex shrink-0 items-center gap-0.5 rounded-control bg-ink-soft p-0.5 shadow-edge";
const pillTrackStyle: CSSProperties = {};

/** `iconOnly` makes a 28px square; text segments keep the height and grow sideways. */
const pillSegment = (iconOnly = false) =>
  `mk-shaped flex h-7 cursor-pointer items-center justify-center gap-space-2 whitespace-nowrap rounded-md text-caption font-medium transition-[background-color,color] disabled:cursor-not-allowed disabled:opacity-50 ${iconOnly ? "w-7" : "px-space-4"}`;

const pillSegmentStyle = (on: boolean): CSSProperties => ({
  background: on ? "var(--surface-0)" : "transparent",
  // 12px type holds the 7:1 small-type bar in dark: the chosen segment takes
  // the accent's text tone (--accent: 6.3:1 on the raised segment, --accent-text
  // 8.9:1; the same blue in light), and the others the secondary step (2026-11-25).
  color: on ? "var(--accent-text)" : "var(--text-secondary)",
});

export { pillSegment, pillSegmentStyle, pillTrack, pillTrackStyle };
