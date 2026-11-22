"use client";

import { buttonLook, type ButtonSize, type ButtonVariant } from "../button/button";
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { usePresence } from "@/hooks/usePresence";
// The file, not the form barrel: the kit's form fields import from ui.
import { DropdownPanel } from "../listbox/dropdown-panel";

type PopoverAlign = "start" | "end";

const FOCUSABLE = 'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/**
 * The trigger's look, drawn on the trigger <button> itself (review, 22 Nov
 * 2026): one element owns hover, focus and the open state, so a ⋯ never shows
 * a square veil behind a rounded button. A kit button look, or `field` for a
 * field-shaped trigger (a date range).
 */
type PopoverLook = { variant: ButtonVariant; size: ButtonSize; iconOnly?: boolean } | "field";

type PopoverProps = {
  /** The trigger's content: an icon, a label. With `look`, never a styled box of its own. */
  button: ReactNode;
  /** Draws the trigger as a kit button or a field; see PopoverLook. */
  look?: PopoverLook;
  /** Classes added to the trigger <button> (layout, or a field's text colour). */
  triggerClassName?: string;
  /** Data attributes on the trigger <button>: a field's `data-state`, a filter's `data-active`. */
  triggerData?: Record<`data-${string}`, string | boolean | undefined>;
  /** Accessible name for the trigger. */
  label: string;
  /** Which edge of the trigger the panel lines up with, in logical terms. */
  align?: PopoverAlign;
  /** Panel width in pixels, capped to the viewport. */
  width?: number;
  className?: string;
  /** `pill` gives the trigger Button's xs/soft look (a top-bar action); `plain` leaves it to its content. */
  trigger?: "plain" | "pill" | "block";
  /** Given a `close` so an item can dismiss the panel after acting. */
  children: (close: () => void) => ReactNode;
  /** Ids read after the trigger's name: its current value, a field's hint or error. */
  describedBy?: string;
  /** Each time it opens: a picker starting its draft over from the saved value. */
  onOpen?: () => void;
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
  // Fills its row: a field-shaped trigger (a date range).
  block: "flex w-full cursor-pointer items-center",
  // A secondary sm button (Share, the review chip): it was its own 32px grey
  // pill, the same fill as a disabled button (review, 22 Nov 2026).
  pill: buttonLook("secondary", "sm"),
};

const iconWidths: Record<ButtonSize, string> = { xs: "w-ctl-xs", sm: "w-ctl-sm", md: "w-ctl-md", lg: "w-ctl-lg" };

function lookClasses(look: PopoverLook): string {
  if (look === "field") return "mk-field flex w-full min-w-0 items-center gap-ctl-icon text-start";
  const icon = look.iconOnly ? `${iconWidths[look.size]} !px-0 ${look.variant === "ghost" ? "text-text-muted" : ""}` : "";
  return `${buttonLook(look.variant, look.size)} ${icon}`;
}

const Popover = ({ button, look, triggerClassName = "", triggerData, label, align = "end", width = 260, className, trigger = "plain", children, describedBy, onOpen }: PopoverProps) => {
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
    // A panel can name where focus should land (a calendar's chosen day) with
    // `data-autofocus`; otherwise its first control.
    const frame = requestAnimationFrame(() =>
      (contentRef.current?.querySelector<HTMLElement>("[data-autofocus]") ?? contentRef.current?.querySelector<HTMLElement>(FOCUSABLE))?.focus({ preventScroll: true }),
    );
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
        aria-describedby={describedBy}
        title={label}
        onClick={() => {
          if (!open) onOpen?.();
          setOpen(!open);
        }}
        {...triggerData}
        data-variant={look && look !== "field" ? look.variant : undefined}
        data-size={look && look !== "field" ? look.size : undefined}
        className={`${look ? lookClasses(look) : triggers[trigger]} ${triggerClassName}`}
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
