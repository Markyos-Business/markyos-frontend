/**
 * Motion for the app's JS: the same numbers as the CSS (tailwind/motion.js),
 * and the shared variants every component uses instead of its own keyframes.
 */
import { DURATION, EXIT, STAGGER } from "../../tailwind/motion.js";

export { DURATION, EXIT, STAGGER };

/** The animation utilities, by job. Enter and exit pairs share a key. */
export const variants = {
  fadeIn: { enter: "animate-fade-in", exit: "animate-fade-out" },
  /** Content arriving: a card, a page, a row. */
  fadeUp: { enter: "animate-fade-up", exit: "animate-fade-out" },
  /** Menus, popovers, tooltips: zoom from 96% and nudge from the trigger's side. */
  scaleIn: { enter: "animate-scale-in", exit: "animate-scale-out" },
  /** Dialogs: the same zoom, slower in, quicker out. */
  dialog: { enter: "animate-dialog-in", exit: "animate-dialog-out" },
  /** A sheet from the reading-start edge (mirrors in Arabic). */
  slideFromStart: { enter: "animate-sheet-in-start", exit: "animate-sheet-out-start" },
  /** A sheet from the reading-end edge. */
  slideFromEnd: { enter: "animate-sheet-in-end", exit: "animate-sheet-out-end" },
} as const;

export type Variant = keyof typeof variants;

/** The class for a variant, entering or leaving. */
export const motionClass = (variant: Variant, closing: boolean) => (closing ? variants[variant].exit : variants[variant].enter);

/** When the current page arrived (performance.now), set by `PageTransition`. */
let pageArrivedAt = -Infinity;

/** Marks that a page has just mounted: its own transition is playing. */
export const markPageArrived = () => {
  if (typeof performance !== "undefined") pageArrivedAt = performance.now();
};

/**
 * Whether a page arrived a moment ago. Content mounting with the page rides
 * the page's own transition rather than animating twice, so `FadeIn` and
 * `Stagger` stay still then and only animate what appears later (data
 * arriving, a panel opening).
 */
export const pageJustArrived = () => typeof performance !== "undefined" && performance.now() - pageArrivedAt < DURATION.slow;
