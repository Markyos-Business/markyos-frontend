"use client";

import { ViewTransition, useEffect, type ReactNode } from "react";

/** Set after the first page has drawn, so a full load never moves focus. */
let navigated = false;

/**
 * A page arriving: the content area only, so the sidebar and header stay put.
 *
 * Wraps a route's page in React's `<ViewTransition>`, which Next starts on
 * every navigation: the old page fades out quickly and the new one fades up
 * 8px (`page-exit` / `page-enter` in tailwind/motion.js). A browser without
 * View Transitions gets the same fade-up as a plain CSS animation instead.
 * Navigation never waits on it.
 *
 * After a navigation (not on the first load) focus moves to the new page's
 * heading, so a screen reader announces where you are and the keyboard
 * starts there.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!navigated) {
      navigated = true;
      return;
    }
    const heading = document.querySelector<HTMLElement>("main h1, h1");
    if (!heading) return;
    if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }, []);

  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <div className="mk-page">{children}</div>
    </ViewTransition>
  );
}
