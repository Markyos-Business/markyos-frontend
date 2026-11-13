"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { usePresence } from "@/hooks/usePresence";
// The file, not the form barrel: the kit's form fields import from ui.
import { DropdownPanel } from "../listbox/dropdown-panel";

type PopoverAlign = "start" | "end";

const FOCUSABLE = 'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

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
  pill: "mk-btn inline-flex h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-surface-2 px-3.5 text-[12px] font-medium leading-none text-text",
};

const Popover = ({ button, label, align = "end", width = 260, className, trigger = "plain", children }: PopoverProps) => {
  const [open, setOpen] = useState(false);
  const { mounted, closing } = usePresence(open);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const closeToTrigger = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeToTrigger();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, closeToTrigger]);

  // The panel renders in a portal, at the end of the page, so Tab from the
  // trigger would never reach it. Opening moves focus to its first control.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => contentRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Tabbing off either end of the panel closes it and goes back to the
  // trigger, rather than dropping focus at the end of the page.
  function onPanelKeyDown(e: ReactKeyboardEvent) {
    if (e.key !== "Tab" || !contentRef.current) return;
    const items = [...contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const edge = e.shiftKey ? items[0] : items[items.length - 1];
    if (!edge || document.activeElement === edge) {
      e.preventDefault();
      closeToTrigger();
    }
  }

  return (
    <div className={`relative ${className ?? ""}`}>
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
        // In a portal, above everything: a menu in a table row was painted
        // under the rows after it, and a scrolling table would clip it.
        <DropdownPanel anchor={triggerRef} closing={closing} onOutside={close} width={width} maxHeight={560} align={align} padded={false}>
          <div ref={contentRef} onKeyDown={onPanelKeyDown} className="min-h-0 overflow-y-auto">
            {children(close)}
          </div>
        </DropdownPanel>
      )}
    </div>
  );
};

export { Popover };
export type { PopoverAlign, PopoverProps };
