"use client";

import { useEffect, useRef, useState } from "react";
import { DURATION } from "@/lib/motion";

/**
 * Long enough to read the busy label and see the button settle. It is a
 * reading time, not an animation, so it stays the same under reduced motion.
 */
const MIN_BUSY_MS = DURATION.slow * 2;

/**
 * `busy`, held on for at least `minMs` once it turns on.
 *
 * A local refresh can finish in a few dozen milliseconds, so a button that
 * follows `loading` directly blinks into its busy state and straight back
 * out. This keeps the busy state long enough to register, then lets it go.
 * Turning on is never delayed; only the end is held.
 */
export function useMinBusy(busy: boolean, minMs = MIN_BUSY_MS): boolean {
  const [held, setHeld] = useState(busy);
  const since = useRef<number | null>(null);

  useEffect(() => {
    if (busy) {
      since.current ??= Date.now();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors `busy` turning on
      setHeld(true);
      return;
    }
    if (since.current === null) return;
    const left = Math.max(0, minMs - (Date.now() - since.current));
    const timer = setTimeout(() => {
      since.current = null;
      setHeld(false);
    }, left);
    return () => clearTimeout(timer);
  }, [busy, minMs]);

  return busy || held;
}
