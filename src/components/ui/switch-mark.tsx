type SwitchMarkProps = { checked: boolean };

/**
 * The switch as drawn (spec §6.6): a 40×22 track with a 12px radius. Off is
 * the `track` grey with a muted knob; on is the accent with the accent's ink.
 * The knob slides to the reading end — right in English, left in Arabic — by
 * transform, in the 180ms reserved for switch knobs.
 *
 * Only the picture: the control around it (a `role="switch"` button, or a
 * label holding a real checkbox) carries the state and the name.
 */
const SwitchMark = ({ checked }: SwitchMarkProps) => (
  <span aria-hidden className={`relative h-5.5 w-10 shrink-0 rounded-switch transition-colors ${checked ? "bg-accent" : "bg-track"}`}>
    <span
      className={`absolute top-0.75 start-0.75 size-4 rounded-full transition-[translate,background-color] duration-base ${
        checked ? "translate-x-4.5 bg-accent-ink rtl:-translate-x-4.5" : "bg-text-muted"
      }`}
    />
  </span>
);

export { SwitchMark };
export type { SwitchMarkProps };
