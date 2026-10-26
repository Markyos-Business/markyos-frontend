"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePresence } from "@/hooks/usePresence";

type PopoverAlign = "start" | "end";

// Logical insets, so the panel hangs off the same edge of its trigger in
// Arabic as it does in English.
const aligns: Record<PopoverAlign, string> = {
  start: "start-0",
  end: "end-0",
};

type PopoverProps = {
  /** What the trigger looks like. Rendered inside the trigger button. */
  button: ReactNode;
  /** Accessible name for the trigger. */
  label: string;
  /** Which edge of the trigger the panel lines up with, in logical terms. */
  align?: PopoverAlign;
  /** Panel width in pixels, capped to the viewport. */
  width?: number;
  className?: string;
  /** `pill` gives the trigger Button's xs/soft look (a top-bar action); `plain` leaves it to its content. */
  trigger?: "plain" | "pill";
  /** Given a `close` so an item can dismiss the panel after acting. */
  children: (close: () => void) => ReactNode;
};

/**
 * A panel anchored to the control that opened it.
 *
 * Shared by the account menu and the share panel because the fiddly parts are
 * the same either way and are easy to get half-right: closing on a click
 * outside *and* on Escape, putting focus back on the trigger afterwards, and
 * aligning to the writing direction rather than to "the right". It is
 * deliberately not a dialog — nothing here is modal, and trapping focus for a
 * menu would be worse than not having one.
 */
const triggers = {
  plain: "flex cursor-pointer items-center",
  pill: "mk-btn inline-flex h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full bg-surface-2 px-3.5 text-[12px] font-medium leading-none text-text",
};

const Popover = ({ button, label, align = "end", width = 260, className, trigger = "plain", children }: PopoverProps) => {
  const [open, setOpen] = useState(false);
  const { mounted, closing } = usePresence(open);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    // `mousedown`, not `click`: a control inside the panel that re-renders on
    // press would otherwise be gone by the time the click lands, and the
    // outside-click handler would read it as a click on the outside.
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={() => setOpen((v) => !v)}
        className={triggers[trigger]}
      >
        {button}
      </button>

      {mounted && (
        <div
          // A raised surface (spec §1.5): the card fill, its hairline and the
          // one shadow the system allows, for menus and overlays.
          className={`absolute top-full z-dropdown mt-2 overflow-hidden rounded-card bg-surface-1 shadow-edge-pop ${aligns[align]} ${
            closing ? "pointer-events-none animate-fade-out" : "animate-fade-in"
          }`}
          style={{ width, maxWidth: "min(92vw, 520px)" }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
};

export { Popover };
export type { PopoverAlign, PopoverProps };
