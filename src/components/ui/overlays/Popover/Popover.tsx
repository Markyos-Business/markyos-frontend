"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

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
export function Popover({
  button,
  label,
  align = "end",
  width = 260,
  className,
  buttonStyle,
  children,
}: {
  /** What the trigger looks like. Rendered inside the trigger button. */
  button: ReactNode;
  /** Accessible name for the trigger. */
  label: string;
  /** Which edge of the trigger the panel lines up with, in logical terms. */
  align?: "start" | "end";
  width?: number;
  className?: string;
  buttonStyle?: React.CSSProperties;
  /** Given a `close` so an item can dismiss the panel after acting. */
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
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
        className="cursor-pointer flex items-center"
        style={buttonStyle}
      >
        {button}
      </button>

      {open && (
        <div
          className="absolute z-50 animate-fade-in rounded-xl overflow-hidden"
          style={{
            top: "calc(100% + 8px)",
            // Logical inset, so the panel hangs off the same edge of its
            // trigger in Arabic as it does in English.
            insetInlineEnd: align === "end" ? 0 : undefined,
            insetInlineStart: align === "start" ? 0 : undefined,
            width,
            maxWidth: "min(92vw, 520px)",
            background: "var(--surface-0)",
            boxShadow: "0 0 0 1px var(--hairline-strong), var(--shadow-pop)",
          }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
