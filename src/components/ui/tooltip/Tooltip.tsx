"use client";

import { cloneElement, isValidElement, useId, useLayoutEffect, useRef } from "react";
import type { ReactElement, ReactNode } from "react";

/**
 * Which side of the trigger it opens on. `start` and `end` follow the
 * reading direction, so a tooltip set to open beside a row's end opens on
 * the right in English and the left in Arabic. Prefer `start`/`end` inside
 * dense table rows, where a tall top/bottom tooltip covers the next row.
 */
type TooltipSide = "top" | "bottom" | "start" | "end";

// Centring by half the tooltip's own width has to undo itself in Arabic,
// where `start-1/2` anchors from the right.
const sides: Record<TooltipSide, string> = {
  top: "bottom-full start-1/2 mb-2 -translate-x-1/2 rtl:translate-x-1/2",
  bottom: "top-full start-1/2 mt-2 -translate-x-1/2 rtl:translate-x-1/2",
  start: "end-full top-1/2 me-2 -translate-y-1/2",
  end: "start-full top-1/2 ms-2 -translate-y-1/2",
};

// The arrow: a bordered triangle in the tooltip's own fill, pointing back at
// the trigger.
const arrows: Record<TooltipSide, string> = {
  top: "top-full start-1/2 -translate-x-1/2 rtl:translate-x-1/2 border-t-solid",
  bottom: "bottom-full start-1/2 -translate-x-1/2 rtl:translate-x-1/2 border-b-solid",
  start: "start-full top-1/2 -translate-y-1/2 border-s-solid",
  end: "end-full top-1/2 -translate-y-1/2 border-e-solid",
};

type TooltipProps = {
  content: string;
  /** The trigger. A focusable element is described by the tooltip for screen readers. */
  children: ReactNode;
  side?: TooltipSide;
  className?: string;
};

/**
 * A short explanation on hover and on keyboard focus. On hover it waits a
 * moment (`delay-tooltip`) so passing the pointer over doesn't flash it; on
 * focus it shows at once. It never takes a click: a hint, not a control.
 */
const Tooltip = ({ content, children, side = "top", className = "" }: TooltipProps) => {
  const id = useId();
  const bubble = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const place = () => {
      const el = bubble.current;
      if (!el) return;
      el.style.setProperty("--tooltip-shift-x", "0px");
      const r = el.getBoundingClientRect();
      const shift = r.left < 16 ? 16 - r.left : r.right > innerWidth - 16 ? innerWidth - 16 - r.right : 0;
      el.style.setProperty("--tooltip-shift-x", `${shift}px`);
    };
    place();
    const directionChanges = new MutationObserver(place);
    directionChanges.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"], subtree: true });
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { directionChanges.disconnect(); window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [side, content]);
  const trigger = isValidElement(children)
    ? cloneElement(children as ReactElement<{ "aria-describedby"?: string }>, { "aria-describedby": id })
    : children;
  return (
    <span className={`group/tooltip relative inline-flex ${className}`}>
      {trigger}
      <span
        id={id}
        ref={bubble}
        style={{ transform: "translateX(var(--tooltip-shift-x, 0px))" }}
        role="tooltip"
        className={`pointer-events-none absolute z-dropdown w-56 max-w-[calc(100vw-32px)] rounded-lg bg-solid px-space-4 py-space-3 text-caption font-normal text-solid-ink opacity-0 shadow-pop transition-opacity duration-fast ease-out group-hover/tooltip:opacity-100 group-hover/tooltip:delay-tooltip group-focus-within/tooltip:opacity-100 group-focus-within/tooltip:delay-0 ${sides[side]}`}
      >
        {content}
        <span aria-hidden className={`absolute border-4 border-transparent ${arrows[side]}`} />
      </span>
    </span>
  );
};

export { Tooltip };
export type { TooltipProps, TooltipSide };
