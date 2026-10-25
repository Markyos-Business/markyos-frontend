"use client";

import { useEffect } from "react";

/** Total time a cited element stays lit: on, then a 180ms fade. Under 600ms. */
const HIGHLIGHT_MS = 380;

/**
 * Scrolls to the element a citation link names and lights it briefly. No
 * movement: the fill fades, nothing slides. `targetId` maps the page's query
 * string to an element id, or null when the link names nothing here.
 */
export function useCitationJump(ready: boolean, targetId: (params: URLSearchParams) => string | null) {
  useEffect(() => {
    if (!ready) return;
    const id = targetId(new URLSearchParams(window.location.search));
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    target.classList.add("bg-accent-soft");
    const t = window.setTimeout(() => target.classList.remove("bg-accent-soft"), HIGHLIGHT_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the content is ready
  }, [ready]);
}
