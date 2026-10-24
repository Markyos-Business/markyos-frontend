// The switch (spec §6.6): a 40×22 track with a 12px radius. Off is the
// `track` grey with a muted knob; on is the accent with the accent's ink. The
// knob takes the 180ms reserved for switch knobs.
//
// The card around it carries `group/toggle` and the real checkbox;
// `group-has-checked` reads the checkbox from anywhere inside the card (a
// `peer` class only reaches the input's siblings, not what sits inside them).
// On sends the knob to the reading end: right in English, left in Arabic.
const SwitchTrack = () => (
  <span aria-hidden className="relative h-5.5 w-10 shrink-0">
    <span className="absolute inset-0 rounded-switch bg-track transition-colors group-has-checked/toggle:bg-accent" />
    <span className="absolute top-0.75 start-0.75 size-4 rounded-full bg-text-muted transition-[translate,background-color] duration-base group-has-checked/toggle:translate-x-4.5 group-has-checked/toggle:bg-accent-ink rtl:group-has-checked/toggle:-translate-x-4.5" />
  </span>
);

export { SwitchTrack };
