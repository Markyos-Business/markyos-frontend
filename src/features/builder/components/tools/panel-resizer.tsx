"use client";

import { useRef } from "react";
import { TOOLS_MAX_W, TOOLS_MIN_W } from "../../hooks/use-builder-panels";

/**
 * The tools panel's edge: drag it to make the panel wider or narrower, or
 * focus it and use the arrow keys (Home/End for the extremes). The width is
 * remembered in this browser. Mirrors in Arabic: the panel is on the right,
 * so dragging left widens it.
 */
export function PanelResizer({
  width,
  onWidth,
  isAr,
  label,
}: {
  width: number;
  onWidth: (w: number) => void;
  isAr: boolean;
  label: string;
}) {
  const start = useRef<{ x: number; w: number } | null>(null);
  const sign = isAr ? -1 : 1;

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={TOOLS_MIN_W}
      aria-valuemax={TOOLS_MAX_W}
      aria-valuenow={width}
      tabIndex={0}
      className="group relative z-10 -mx-1 w-2 shrink-0 cursor-col-resize touch-none outline-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = { x: e.clientX, w: width };
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        onWidth(start.current.w + sign * (e.clientX - start.current.x));
      }}
      onPointerUp={() => {
        start.current = null;
      }}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 48 : 16;
        const grow = e.key === (isAr ? "ArrowLeft" : "ArrowRight");
        const shrink = e.key === (isAr ? "ArrowRight" : "ArrowLeft");
        if (grow || shrink) {
          e.preventDefault();
          onWidth(width + (grow ? step : -step));
        } else if (e.key === "Home") {
          e.preventDefault();
          onWidth(TOOLS_MIN_W);
        } else if (e.key === "End") {
          e.preventDefault();
          onWidth(TOOLS_MAX_W);
        }
      }}
    >
      {/* The visible line: the hairline at rest, the accent while hovered, dragged or focused. */}
      <span aria-hidden className="absolute inset-y-0 start-1/2 w-0.5 -translate-x-1/2 rtl:translate-x-1/2 bg-transparent transition-colors duration-instant group-hover:bg-accent group-focus-visible:bg-accent" />
    </div>
  );
}
