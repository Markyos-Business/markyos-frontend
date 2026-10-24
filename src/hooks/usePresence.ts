"use client";

import { useEffect, useState } from "react";

/** How long an exit animation runs: `--duration-fast`. */
const EXIT_MS = 150;

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
 */
const usePresence = (open: boolean, exitMs = EXIT_MS): Presence => {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- following `open` is the effect
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setClosing(true);
    const t = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, reduce ? 0 : exitMs);
    return () => window.clearTimeout(t);
    // `mounted` is read, not followed: the exit starts only when `open` changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, exitMs]);

  return { mounted, closing };
};

export { usePresence };
export type { Presence };
