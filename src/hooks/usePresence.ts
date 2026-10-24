"use client";

import { useEffect, useState } from "react";

/** How long an exit animation runs: `--duration-fast`. */
const EXIT_MS = 120;

type Presence = {
  /** Render the element at all. */
  mounted: boolean;
  /** It is on its way out: play the exit animation and stop taking clicks. */
  closing: boolean;
};

/**
 * Keeps something on screen for the length of its exit animation.
 *
 * React removes an element the moment `open` turns false, so a menu or modal
 * could only ever pop out of existence. This holds it mounted for one fast
 * beat with `closing` set, long enough to fade, and then lets it go. Under
 * reduced motion there is nothing to wait for, so it goes at once.
 *
 * Opening is never delayed: `mounted` follows `open` in the same render, so a
 * menu is on screen the moment it is asked for. Only the exit is held, and
 * reopening during an exit simply cancels it.
 */
const usePresence = (open: boolean, exitMs = EXIT_MS): Presence => {
  const [exiting, setExiting] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  // Derived from the previous render rather than set in an effect, so the
  // exit starts in the same commit that closed it (React's "storing
  // information from previous renders").
  if (open !== wasOpen) {
    setWasOpen(open);
    setExiting(!open);
  }

  useEffect(() => {
    if (!exiting) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setExiting(false), reduce ? 0 : exitMs);
    return () => window.clearTimeout(t);
  }, [exiting, exitMs]);

  return { mounted: open || exiting, closing: !open && exiting };
};

export { usePresence };
export type { Presence };
