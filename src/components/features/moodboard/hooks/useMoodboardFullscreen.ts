"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalPref } from "@/hooks/useLocalPref";

/**
 * The board has the window to itself: page chrome gone, sidebar down to its
 * rail, and the browser's own chrome gone too where it is allowed.
 *
 * Session state, not a preference. Somebody who closes the tab mid-arrange and
 * comes back tomorrow should land on a normal page with its navigation, not on
 * a bare canvas wondering where the app went.
 */
export function useMoodboardFullscreen() {
  const [fullscreen, setFullscreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalPref("markyos:ui:sidebar-collapsed", false);
  /** What the rail was before full screen took it, so exiting gives it back. */
  const railBefore = useRef(false);

  /**
   * Full screen, applied.
   *
   * Written as an action rather than an effect on `fullscreen`, because it is
   * one: the rail's previous value has to be captured at the moment of the
   * click, and an effect that both reads and writes that value would re-run on
   * its own write and immediately give the rail back.
   *
   * The browser's own full screen is requested best-effort. It can be refused —
   * inside an iframe, under a permissions policy, or on a platform that has no
   * such mode — and the in-app half is the part that matters, so a refusal is
   * not worth a message. What is worth handling is the opposite direction: F11
   * or Esc leaves browser full screen without telling React, so `fullscreenchange`
   * brings the two back into agreement below.
   */
  const applyFullscreen = useCallback(
    (next: boolean) => {
      setFullscreen(next);
      if (next) {
        railBefore.current = sidebarCollapsed;
        setSidebarCollapsed(true);
        void document.documentElement.requestFullscreen?.().catch(() => {});
        return;
      }
      // Only give the rail back if we were the ones who took it.
      if (!railBefore.current) setSidebarCollapsed(false);
      if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {});
    },
    [sidebarCollapsed, setSidebarCollapsed],
  );

  /*
   * The latest values, for a listener that is registered once.
   *
   * `fullscreenchange` and the unmount cleanup both have to see what is true
   * *now*, and re-registering the listener on every change would mean adding and
   * removing a document listener on every render. Written in an effect rather
   * than during render, which is the rule: a ref is not render output.
   */
  const fullscreenRef = useRef(false);
  const applyRef = useRef(applyFullscreen);
  useEffect(() => {
    fullscreenRef.current = fullscreen;
    applyRef.current = applyFullscreen;
  });

  useEffect(() => {
    function onChange() {
      // Left the browser's full screen by some other route — F11, Esc, the
      // window manager. The mode has to follow, or the page sits chrome-less in
      // a normal window with no obvious way back.
      if (!document.fullscreenElement && fullscreenRef.current) applyRef.current(false);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      // Navigating away while immersive must not leave the rail collapsed and
      // the browser in full screen with no board to justify either.
      if (fullscreenRef.current) applyRef.current(false);
    };
  }, []);

  return { fullscreen, applyFullscreen };
}
