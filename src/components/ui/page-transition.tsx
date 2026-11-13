"use client";

import { ViewTransition, useEffect, useState, type ReactNode } from "react";
import { markPageArrived } from "@/lib/motion";

/**
 * The address the tab first loaded, so a full load never moves focus. Compared
 * by URL rather than a "has run" flag: React runs effects twice in development,
 * and the second run is the same page, not a navigation (it used to focus the
 * heading before the page had hydrated). Cleared after the first real move so
 * coming back to that page still announces it.
 */
let firstUrl: string | null = null;

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
  // Before the children render, so cards mounting with this page know the
  // page is already animating and don't animate a second time.
  useState(markPageArrived);
  useEffect(() => {
    const here = window.location.pathname + window.location.search;
    if (firstUrl === null) {
      firstUrl = here;
      return;
    }
    if (here === firstUrl) return;
    firstUrl = "";
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
