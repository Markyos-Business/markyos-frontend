"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { VIEWPORT_WIDTH } from "@/shared/lib/doc/core/types";
import type { Breakpoint } from "@/shared/lib/doc/core/types";

/**
 * The canvas, framed at a real viewport width.
 *
 * This is the part a preview normally gets wrong. Shrinking the browser window
 * is the only honest test of a responsive page, and an editor that renders the
 * page at whatever width is left over between two panels is not showing anyone
 * their phone layout — it is showing them a squashed desktop one.
 *
 * So the frame is laid out at the exact pixel width of the chosen breakpoint
 * and then scaled down with a transform to fit the space available. The element
 * still *believes* it is 390px wide; only the pixels on screen are smaller.
 * Scaling the content and leaving the layout width alone is the version that
 * lies.
 *
 * **This works because the page's breakpoints are container queries.** An earlier
 * version of this comment claimed the framed element being 390px meant "the same
 * media queries fire that fire on a phone", and that is simply not how `@media`
 * works — it resolves against the viewport, which is the whole window. Every
 * responsive override a studio set was emitted correctly and applied nowhere on
 * this canvas. The page root is now a named container (`g-page`, declared in
 * `app/globals.css`) and the rules resolve against *it*, so this element's width
 * is genuinely the one they measure. See `lib/doc/css/emit.ts`.
 *
 * `zoom` would be simpler and is still wrong here: it changes the width
 * descendants resolve against, which is precisely the thing being previewed.
 */
/**
 * How tall the frame stands, per breakpoint — a plausible device, not a guess.
 * 844 is an iPhone 14's CSS height; 1080 an iPad in portrait; 800 a laptop
 * viewport once the browser chrome is taken off a 900px screen.
 */
const FRAME_HEIGHT: Record<Breakpoint, number> = { desktop: 800, tablet: 1080, phone: 844 };

/**
 * The smallest the frame may be drawn before the canvas scrolls instead.
 *
 * With both side panels open on a 1440px screen there are about 634px left for
 * a 1200px desktop frame, so the page was drawn at **51%** — 16px body copy
 * rendered at 8px, in an editor whose central gesture is clicking a line of
 * text to rewrite it. The act of selecting a section, which opens the
 * inspector, was what made that section unreadable.
 *
 * Below this the frame holds its size and the canvas scrolls sideways, which is
 * what every other design tool does and what a designer expects. 0.65 keeps
 * body copy above 10px, which is the app's own floor for readable type.
 */
const MIN_SCALE = 0.65;

export function CanvasFrame({
  breakpoint,
  dir,
  children,
  isAr,
  reserved = 0,
}: {
  breakpoint: Breakpoint;
  dir: "ltr" | "rtl";
  children: ReactNode;
  isAr: boolean;
  /**
   * An adjustment to the width the scale is computed against, so that opening a
   * panel does not resize the page being edited.
   *
   * Signed, and normally negative: the caller lays the canvas out as though the
   * widest panel were always open. An earlier version added the panel's width
   * back when it *was* open, which held the scale just as steady and overflowed
   * once there was enough room for a scale of 1.0 but not enough to draw a
   * 1200px frame. Reserving downward is the version that also fits.
   *
   * This is the fix for the editor shaking on its most common gesture.
   * Selecting a section opens the inspector, which is a 300px flex sibling, so
   * the canvas host went 912px → 612px and the frame re-fitted 0.76 → 0.65.
   * The page being edited physically shrank by 14% over 260ms at the exact
   * moment somebody clicked a line of text to rewrite it — and grew back on
   * Escape, so clicking around made it pulse. Measured: eleven layout shifts
   * from three selections.
   *
   * Adding the panel's width back means opening it changes `available` by
   * nothing, so the zoom holds and the canvas scrolls instead — which is what
   * every design tool does, and why a Figma panel never resizes the artboard.
   * A genuine change, like resizing the window or collapsing the tools rail,
   * moves `clientWidth` without moving this, and still re-fits.
   */
  reserved?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const width = VIEWPORT_WIDTH[breakpoint];

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    function fit() {
      if (!host) return;
      const available = host.clientWidth + reserved;
      if (available <= 0) return;
      // Never scale *up*. A phone frame blown up to fill a 27-inch display
      // would be a picture of nothing anyone owns, and the type would be
      // unreadably large next to the app's own. And never below MIN_SCALE:
      // past that the canvas scrolls rather than shrinking further.
      setScale(Math.min(1, Math.max(MIN_SCALE, available / width)));
    }

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    return () => observer.disconnect();
  }, [width, reserved]);

  const label =
    breakpoint === "desktop"
      ? isAr ? "سطح المكتب" : "Desktop"
      : breakpoint === "tablet"
        ? isAr ? "لوحي" : "Tablet"
        : isAr ? "هاتف" : "Phone";

  return (
    // `overflow-x-auto`, because the scale now has a floor: when the frame is
    // wider than the space left between the panels, the canvas scrolls rather
    // than drawing the page too small to edit.
    <div ref={hostRef} className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-auto">
      {/* The frame's own chrome is laid out left-to-right whatever the page
          inside it is. It carries no text of its own, and pinning it means the
          scale transform always originates from the same corner as the box it
          is scaling — which `transform-origin` has no logical form to express. */}
      <div
        dir="ltr"
        className="mx-auto flex flex-col items-center gap-2 pb-6"
        style={{ width: width * scale }}
      >
        <div
          className="flex items-center gap-2 text-[10.5px] font-semibold shrink-0 pt-1"
          style={{ color: "var(--text-faint)", letterSpacing: "0.04em" }}
        >
          <span>{label}</span>
          {/* Wrapped so the width reads as a number in both directions: inside
              an Arabic interface a bare "1200 px" can paint as "px 1200". */}
          <span dir="ltr" className="bidi-auto">{width}px</span>
          {scale < 1 && <span dir="ltr" className="bidi-auto">· {Math.round(scale * 100)}%</span>}
        </div>

        {/* Two boxes, because a transform does not change the space an element
            reserves. The outer one is the scaled size, so the page lays out
            around what is actually drawn; the inner one is the real device
            size, so the page inside it measures what it would measure on the
            device. */}
        {/*
          Both boxes animate between widths.

          Switching Desktop → Phone used to be a jump cut, and a jump cut makes
          you re-find the page you were looking at. Moving the frame carries the
          one fact worth carrying: this is the *same* page, narrower. The global
          reduced-motion rule flattens both to 0.01ms, so nobody who asked not
          to be moved has to watch it.
        */}
        <div
          style={{
            width: width * scale,
            height: FRAME_HEIGHT[breakpoint] * scale,
            transition: "width 260ms cubic-bezier(0.2, 0.7, 0.3, 1), height 260ms cubic-bezier(0.2, 0.7, 0.3, 1)",
          }}
        >
          <div
            dir={dir}
            className="rounded-2xl overflow-y-auto"
            // Named so a sweep can find *this* element rather than guessing
            // from a style attribute. The width it reports is the number the
            // page's media queries resolve against, which is the only thing
            // worth measuring here and is invisible to every other selector.
            data-canvas-frame={breakpoint}
            style={{
              /*
               * Published so the editing chrome inside the page can undo it.
               *
               * The grip, the section toolbar and the parked badge live inside
               * this scaled subtree, so a 26px control was drawn at 13px on a
               * half-scale canvas — under the 24px floor WCAG 2.5.8 sets, and
               * for the same reason it sets it: a target measured in device
               * pixels is what a finger or a trackpad has to hit, and it does
               * not care what the element believes it is. The page's *content*
               * must scale, because that is the thing being previewed; the
               * tools for editing it must not, because they are not part of the
               * page at all.
               */
              ["--canvas-scale" as string]: scale,
              width,
              // A real height, not `auto`: a device is a window onto a page
              // that scrolls, and a frame that simply grows to fit its content
              // cannot show anyone whether their hero fits above the fold.
              height: FRAME_HEIGHT[breakpoint],
              transform: scale < 1 ? `scale(${scale})` : undefined,
              transformOrigin: "top left",
              transition:
                "width 260ms cubic-bezier(0.2, 0.7, 0.3, 1), height 260ms cubic-bezier(0.2, 0.7, 0.3, 1), transform 260ms cubic-bezier(0.2, 0.7, 0.3, 1)",
              boxShadow: "0 0 0 1px var(--hairline-strong), var(--shadow-modal)",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
