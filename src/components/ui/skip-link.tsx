"use client";

import type { MouseEvent } from "react";
import { useUiStrings } from "./ui-strings";

/**
 * The first stop on Tab: hidden until focused, then it jumps past the sidebar
 * and top bar into the page's <main>. Focus moves with the jump, so the next
 * Tab continues inside the content rather than back in the chrome.
 */
export function SkipLink() {
  const { t } = useUiStrings();

  const jump = (event: MouseEvent<HTMLAnchorElement>) => {
    const main = document.querySelector<HTMLElement>("main");
    if (!main) return;
    event.preventDefault();
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: "start" });
  };

  return (
    <a
      href="#main"
      onClick={jump}
      className="mk-btn sr-only z-popover rounded-control bg-accent px-ctl-px-md text-body font-medium text-accent-ink focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:inline-flex focus:h-ctl-md focus:items-center"
    >
      {t.skipToContent}
    </a>
  );
}
