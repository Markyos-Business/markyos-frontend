/**
 * Motion: the one source for every duration, curve and distance in Markyos.
 *
 * Calm and fast. Things that enter ease out, things that leave ease in and go
 * about 30% quicker, nothing overshoots, and nothing takes longer than 300ms
 * except a chart drawing itself once. Read by the Tailwind config (tokens,
 * utilities, keyframes) and by the app's JS (`src/lib/motion.ts`), so a timer
 * waiting for an exit and the CSS playing it can never disagree.
 *
 * Movement is only ever `transform` and `opacity` (plus a collapsible's
 * grid rows and the desktop sidebar's width). Under reduced motion every
 * distance and scale collapses to nothing and every duration to 100ms or less,
 * so the same animations turn into plain quick fades with no extra code.
 */

/** Milliseconds, for JS that has to wait for a transition to finish. */
export const DURATION = {
  /** Hover, press, colour changes. */
  instant: 100,
  /** Tooltips, dropdowns, small UI. */
  fast: 150,
  /** Cards, tabs, page content. */
  base: 200,
  /** Sidebar, sheets, dialogs. */
  slow: 280,
  /** A chart drawing itself, once, on first mount. */
  chart: 500,
};

/** Stagger between items in a group, and how many items take part. */
export const STAGGER = { step: 40, max: 6 };

/** Leaving is one step quicker than entering (~30%). */
export const EXIT = { fast: DURATION.instant, base: DURATION.fast, slow: DURATION.base };

export const EASE = {
  standard: "cubic-bezier(0.4, 0, 0.2, 1)",
  out: "cubic-bezier(0.16, 1, 0.3, 1)",
  in: "cubic-bezier(0.4, 0, 1, 1)",
};

/** The CSS custom properties, the same in both themes. */
export const motionTokens = {
  "--duration-instant": `${DURATION.instant}ms`,
  "--duration-fast": `${DURATION.fast}ms`,
  "--duration-base": `${DURATION.base}ms`,
  "--duration-slow": `${DURATION.slow}ms`,
  "--duration-chart": `${DURATION.chart}ms`,
  "--ease-standard": EASE.standard,
  "--ease-out": EASE.out,
  "--ease-in": EASE.in,
  "--distance-sm": "4px",
  "--distance-md": "8px",
  "--distance-lg": "16px",
  "--stagger-step": `${STAGGER.step}ms`,
  /** How long the pointer rests on something before its tooltip shows. */
  "--delay-tooltip": "300ms",
  /** How far an overlay zooms from. */
  "--scale-from": "0.96",
  /** +1 left to right, -1 right to left: multiplies every horizontal slide. */
  "--dir-sign": "1",
};

/** Reduced motion: no movement, no zoom, no stagger, no draw — fades of 100ms or less. */
export const reducedMotionTokens = {
  "--duration-fast": `${DURATION.instant}ms`,
  "--duration-base": `${DURATION.instant}ms`,
  "--duration-slow": `${DURATION.instant}ms`,
  "--duration-chart": "0ms",
  "--distance-sm": "0px",
  "--distance-md": "0px",
  "--distance-lg": "0px",
  "--stagger-step": "0ms",
  "--scale-from": "1",
};

export const transitionDuration = {
  DEFAULT: "var(--duration-instant)",
  instant: "var(--duration-instant)",
  fast: "var(--duration-fast)",
  base: "var(--duration-base)",
  slow: "var(--duration-slow)",
  chart: "var(--duration-chart)",
};

export const transitionDelay = {
  tooltip: "var(--delay-tooltip)",
};

export const transitionTimingFunction = {
  DEFAULT: "var(--ease-standard)",
  standard: "var(--ease-standard)",
  out: "var(--ease-out)",
  in: "var(--ease-in)",
};

const slideX = (sign) => `translate3d(calc(${sign} * var(--dir-sign) * 100%), 0, 0)`;

export const keyframes = {
  "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
  "fade-out": { from: { opacity: "1" }, to: { opacity: "0" } },
  /** Content arriving: up from 8px below. */
  "fade-up": { from: { opacity: "0", transform: "translate3d(0, var(--distance-md), 0)" }, to: { opacity: "1", transform: "none" } },
  /** An overlay: zooms from 96%, nudged 4px from its trigger's side (`--enter-x/y`). */
  "scale-in": {
    from: { opacity: "0", transform: "translate3d(var(--enter-x, 0), var(--enter-y, 0), 0) scale(var(--scale-from))" },
    to: { opacity: "1", transform: "none" },
  },
  "scale-out": {
    from: { opacity: "1", transform: "none" },
    to: { opacity: "0", transform: "translate3d(var(--enter-x, 0), var(--enter-y, 0), 0) scale(var(--scale-from))" },
  },
  /** A sheet from the reading-start edge (left in English, right in Arabic), and back. */
  "slide-in-start": { from: { transform: slideX(-1) }, to: { transform: "none" } },
  "slide-out-start": { from: { transform: "none" }, to: { transform: slideX(-1) } },
  /** A sheet from the reading-end edge. */
  "slide-in-end": { from: { transform: slideX(1) }, to: { transform: "none" } },
  "slide-out-end": { from: { transform: "none" }, to: { transform: slideX(1) } },
  /** A toast from the bottom-end corner. */
  "toast-in": {
    from: { opacity: "0", transform: "translate3d(calc(var(--dir-sign) * var(--distance-lg)), var(--distance-md), 0)" },
    to: { opacity: "1", transform: "none" },
  },
  /** A chart's bar growing from its baseline, once. */
  "grow-y": { from: { transform: "scaleY(0)" }, to: { transform: "none" } },
  /** A label sliding in from the reading start as a rail expands. */
  "label-in": {
    from: { opacity: "0", transform: "translate3d(calc(-1 * var(--dir-sign) * var(--distance-sm)), 0, 0)" },
    to: { opacity: "1", transform: "none" },
  },
  /** A chart's line drawing itself, once (needs `pathLength="1"`). */
  draw: { from: { strokeDashoffset: "1" }, to: { strokeDashoffset: "0" } },
  /** The light crossing a loading skeleton. */
  shimmer: { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(100%)" } },
};

export const animation = {
  "fade-in": "fade-in var(--duration-fast) var(--ease-out) both",
  "fade-out": "fade-out var(--duration-instant) var(--ease-in) both",
  "fade-in-base": "fade-in var(--duration-base) var(--ease-out) both",
  "fade-up": "fade-up var(--duration-base) var(--ease-out) both",
  "scale-in": "scale-in var(--duration-fast) var(--ease-out) both",
  "scale-out": "scale-out var(--duration-instant) var(--ease-in) both",
  "dialog-in": "scale-in var(--duration-slow) var(--ease-out) both",
  "dialog-out": "scale-out var(--duration-fast) var(--ease-in) both",
  "sheet-in-start": "slide-in-start var(--duration-slow) var(--ease-out) both",
  "sheet-out-start": "slide-out-start var(--duration-base) var(--ease-in) both",
  "sheet-in-end": "slide-in-end var(--duration-slow) var(--ease-out) both",
  "sheet-out-end": "slide-out-end var(--duration-base) var(--ease-in) both",
  "toast-in": "toast-in var(--duration-base) var(--ease-out) both",
  "grow-y": "grow-y var(--duration-chart) var(--ease-out) both",
  draw: "draw var(--duration-chart) var(--ease-out) both",
  "label-in": "label-in var(--duration-fast) var(--ease-out) both",
  // Ambient loading feedback, not an interaction, so it loops.
  shimmer: "shimmer 1.4s var(--ease-standard) infinite",
  // Work is in progress and hasn't stalled: quicker than `animate-spin`.
  "spin-quick": "spin 720ms linear infinite",
};

/**
 * Base rules that go with the tokens: direction, overlay nudges by side,
 * collapsibles, staggers, and the reduced-motion swap.
 */
export const motionBase = [
  { '[dir="rtl"]': { "--dir-sign": "-1" } },
  // An overlay arrives from its trigger: below it, it comes down 4px; above, up.
  {
    '[data-side="bottom"]': { "--enter-y": "calc(-1 * var(--distance-sm))" },
    '[data-side="top"]': { "--enter-y": "var(--distance-sm)" },
    '[data-side="start"]': { "--enter-x": "calc(var(--dir-sign) * var(--distance-sm))" },
    '[data-side="end"]': { "--enter-x": "calc(-1 * var(--dir-sign) * var(--distance-sm))" },
  },
  /*
   * A collapsible: rows go 0fr → 1fr with the opacity, so it opens to its own
   * height with no measuring. The one child must have `min-height: 0`
   * (`.mk-collapse > *` sets it) and its own overflow hidden.
   */
  {
    ".mk-collapse": {
      display: "grid",
      "grid-template-rows": "0fr",
      opacity: "0",
      transition: "grid-template-rows var(--duration-base) var(--ease-standard), opacity var(--duration-base) var(--ease-standard)",
    },
    ".mk-collapse > *": { "min-height": "0", overflow: "hidden" },
    '.mk-collapse[data-open="true"]': { "grid-template-rows": "1fr", opacity: "1" },
  },
  /*
   * A stagger group: every direct child fades up as it first mounts, 40ms
   * after the one before, the first six only — the rest arrive with the
   * sixth. Mount-only by nature: a re-render or a data refresh doesn't
   * restart a CSS animation.
   */
  {
    ".mk-stagger > *": { animation: "fade-up var(--duration-base) var(--ease-out) both", "animation-delay": "calc(5 * var(--stagger-step))" },
    ".mk-stagger > :nth-child(1)": { "animation-delay": "0ms" },
    ".mk-stagger > :nth-child(2)": { "animation-delay": "var(--stagger-step)" },
    ".mk-stagger > :nth-child(3)": { "animation-delay": "calc(2 * var(--stagger-step))" },
    ".mk-stagger > :nth-child(4)": { "animation-delay": "calc(3 * var(--stagger-step))" },
    ".mk-stagger > :nth-child(5)": { "animation-delay": "calc(4 * var(--stagger-step))" },
  },
  /*
   * The desktop sidebar: its width animates between open and rail, but only
   * once it is on screen (`data-ready`), so loading a page never plays it.
   * Before React runs, a rail remembered as collapsed (SIDEBAR_INIT_SCRIPT)
   * is already drawn at rail width.
   */
  {
    "nav[data-rail][data-ready]": { transition: "width var(--duration-slow) var(--ease-standard)" },
    'html[data-rails-collapsed~="studio"] nav[data-rail="studio"]:not([data-ready]), html[data-rails-collapsed~="admin"] nav[data-rail="admin"]:not([data-ready])':
      { width: "84px", "padding-inline": "0" },
  },
  /*
   * Page transitions (React <ViewTransition>, `PageTransition`): only the
   * content area moves. The old page leaves fast, the new one fades up 8px.
   * The root's own crossfade is switched off, so the sidebar and header
   * don't blink. Browsers without View Transitions get the fade-up as CSS.
   */
  {
    // The wrapper is invisible to layout: a page that fills its pane as a flex
    // child still does, one level down.
    ".mk-page": { display: "flex", "flex-direction": "column", flex: "1 1 auto", "min-height": "0", "min-width": "0" },
    "::view-transition-old(root), ::view-transition-new(root)": { animation: "none" },
    "::view-transition-old(.page-exit)": { animation: "fade-out var(--duration-instant) var(--ease-in) both" },
    "::view-transition-new(.page-enter)": { animation: "fade-up var(--duration-base) var(--ease-out) both" },
    "@supports not (view-transition-name: none)": { ".mk-page": { animation: "fade-up var(--duration-base) var(--ease-out) both" } },
  },
  // A page heading takes focus after a navigation (PageTransition) so screen
  // readers announce it; that focus is for them, so it draws no ring.
  { 'h1[tabindex="-1"]:focus, h1[tabindex="-1"]:focus-visible': { outline: "none !important", "box-shadow": "none !important" } },
  // A number that changes crossfades rather than counting.
  { ".mk-value": { transition: "opacity var(--duration-fast) var(--ease-standard)" } },
  // While the theme swaps, nothing transitions, so colours don't flash.
  // (`.mk-keep-motion` opts out: the toggle's own icon turns while it happens.)
  {
    '[data-theme-switching] *:not(.mk-keep-motion), [data-theme-switching] *::before, [data-theme-switching] *::after': {
      transition: "none !important",
    },
  },
  { "@media (prefers-reduced-motion: reduce)": { ":root": reducedMotionTokens } },
  // The /dev/motion page's switch, to see reduced motion without changing the OS.
  { '[data-reduce-motion="true"]': reducedMotionTokens },
];
