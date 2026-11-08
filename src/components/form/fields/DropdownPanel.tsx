"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";

type DropdownPanelProps = {
  /** The control the panel hangs from; the panel is at least as wide. */
  anchor: RefObject<HTMLElement | null>;
  /** From `usePresence`: fade out before unmounting. */
  closing?: boolean;
  /** A press outside both the anchor and the panel. */
  onOutside: () => void;
  /** A fixed width instead of the anchor's. */
  width?: number;
  className?: string;
  children: ReactNode;
};

type Place = { top: number; left: number; width: number; maxHeight: number; up: boolean };

const GAP = 4;
const MARGIN = 8;

/**
 * The floating list under a field: every dropdown in the kit (select, filter,
 * combobox) opens this one panel, so they all look and behave alike.
 *
 * It renders in a portal with fixed coordinates taken from the anchor, because
 * a field often sits in a drawer or sheet that scrolls, and a panel inside that
 * box would be clipped by it. It flips above the field when there is more room
 * there, follows the field on scroll and resize, and lines up with the field's
 * start edge in either writing direction.
 */
const DropdownPanel = ({ anchor, closing = false, onOutside, width, className = "", children }: DropdownPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<Place | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = anchor.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const w = Math.min(width ?? r.width, window.innerWidth - MARGIN * 2);
      const below = window.innerHeight - r.bottom - MARGIN;
      const above = r.top - MARGIN;
      const up = below < 220 && above > below;
      const rtl = getComputedStyle(el).direction === "rtl";
      const rawLeft = rtl ? r.right - w : r.left;
      const left = Math.max(MARGIN, Math.min(rawLeft, window.innerWidth - w - MARGIN));
      setPlace({
        top: up ? r.top - GAP : r.bottom + GAP,
        left,
        width: w,
        maxHeight: Math.max(160, Math.min(320, (up ? above : below) - GAP)),
        up,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    // Capture, so a scroll in any scrolling ancestor (a drawer) moves it too.
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [anchor, width]);

  useEffect(() => {
    // `mousedown`, not `click`, so an option that re-renders on press is not
    // mistaken for a press outside.
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchor.current?.contains(t)) return;
      onOutside();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [anchor, onOutside]);

  if (!place) return null;
  return createPortal(
    <div
      ref={panelRef}
      // A raised surface (spec §1.5): the card fill, its hairline and the one
      // shadow the system allows for menus.
      className={`fixed z-popover flex flex-col overflow-hidden rounded-card bg-surface-1 p-space-3 shadow-edge-pop ${
        closing ? "pointer-events-none animate-fade-out" : "animate-fade-in"
      } ${className}`}
      style={{
        top: place.top,
        left: place.left,
        width: place.width,
        maxHeight: place.maxHeight,
        transform: place.up ? "translateY(-100%)" : undefined,
      }}
    >
      {children}
    </div>,
    document.body,
  );
};

export { DropdownPanel };
export type { DropdownPanelProps };
