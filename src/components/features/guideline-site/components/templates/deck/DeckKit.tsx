"use client";

import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import { SectionHeading, SectionNote } from "@/components/features/guideline-site/components/LiveEdit";
import { BrandMark } from "@/components/ui/media/BrandMark/BrandMark";
import { DeckPalette } from "./deckTheme";

/**
 * The three slide masters, built to the source deck's real geometry.
 *
 * Every slide is composed at exactly 1920 × 1080 in absolute pixels and then
 * scaled as a whole — never reflowed. That is the source's own instruction
 * ("nothing is responsive; scale the whole frame"), and it is also what keeps
 * a deck a deck: the relationship between a 180px title and a 720px ruled
 * square is the design, and letting it reflow at narrow widths would destroy
 * it. One consequence worth knowing: these slides do not adapt to phone
 * width, they shrink, exactly like a PDF page.
 *
 * Positions use `inset-inline-start` rather than `left` so the whole
 * composition mirrors under `dir="rtl"` without a second set of coordinates.
 */

export const SLIDE_W = 1920;
export const SLIDE_H = 1080;

/** Covers and section openers inset 100px; numbered detail pages inset 50px. */
export const GUTTER_WIDE = 100;
export const GUTTER = 50;

export const RAIL_W = 395;
export const PANEL_X = 495;
export const PANEL_W = 1375;
export const PANEL_H = 980;

/**
 * The factor that fits a 1920-wide slide into whatever is on screen.
 *
 * Measured rather than assumed: this same template renders inside the
 * editor's ~1000px preview card, on a phone, and full-bleed on a desktop
 * browser, and each needs a different factor.
 */
export function useDeckScale() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      // `clientWidth` counts the element's own padding, which the slide never
      // gets to use — measuring it stretched the scale factor and squashed
      // every frame off 16:9. Only the content box is available to a slide.
      const cs = getComputedStyle(el);
      const w = el.clientWidth - parseFloat(cs.paddingInlineStart || "0") - parseFloat(cs.paddingInlineEnd || "0");
      if (w > 0) setScale(w / SLIDE_W);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, scale };
}

/**
 * One slide. The outer box occupies the scaled height in normal document
 * flow, while the inner 1920×1080 composition is scaled inside it — so the
 * page still scrolls naturally and `scrollTo(id)` keeps working, which the
 * table of contents and the scroll-spy both depend on.
 */
export function Slide({
  id,
  scale,
  background,
  children,
  label,
}: {
  id?: string;
  scale: number;
  background: string;
  children: ReactNode;
  /** Accessible name, since a slide is a region a reader can jump to. */
  label?: string;
}) {
  return (
    <div
      id={id}
      role="group"
      aria-label={label}
      className="scroll-mt-4"
      style={{ width: "100%", height: SLIDE_H * scale, position: "relative" }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          // Deliberately `left`, not `insetInlineStart`: the frame is a box,
          // not content. Anchoring it to the inline start pinned its right
          // edge in RTL while `transform-origin` still scaled from the left,
          // so the whole slide slid off the canvas. The composition inside
          // still mirrors, because that uses logical properties.
          left: 0,
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          background,
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Absolute placement on the 1920 grid, mirrored automatically in RTL. */
export function at(x: number, y: number, extra?: CSSProperties): CSSProperties {
  return { position: "absolute", insetInlineStart: x, top: y, ...extra };
}

/**
 * The DetailSlide master: a 395px rail carrying the number, the editable
 * heading and a line of real context, and a 1375 × 980 panel holding the
 * content.
 */
export function DetailSlide({
  id,
  scale,
  pal,
  number,
  sectionId,
  title,
  note,
  panelBackground,
  padded = false,
  children,
  markUrl,
}: {
  id?: string;
  scale: number;
  pal: DeckPalette;
  /** "2.1", "3.1" — the source numbers its detail pages. */
  number: string;
  /** Where an edited heading is stored. Omit to make the heading fixed. */
  sectionId?: string;
  title: string;
  /** One line of genuine context for this page — never filler. */
  note?: string;
  panelBackground?: string;
  padded?: boolean;
  children: ReactNode;
  markUrl?: string;
}) {
  return (
    <Slide id={id} scale={scale} background={pal.paper} label={`${number} ${title}`}>
      <div style={at(GUTTER, GUTTER, { width: RAIL_W, height: PANEL_H })}>
        <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: 48,
              lineHeight: 1,
              color: pal.primary,
            }}
          >
            {number}
          </span>
          {sectionId ? (
            <SectionHeading
              sectionId={sectionId}
              value={title}
              style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 48, lineHeight: 1.05, color: pal.ink }}
            />
          ) : (
            <h2 dir="auto" style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 48, lineHeight: 1.05, color: pal.ink }}>
              {title}
            </h2>
          )}
          {note && (
            <p
              dir="auto"
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 400,
                fontSize: 24,
                lineHeight: 1.3,
                letterSpacing: "-0.04em",
                color: pal.textBody,
                whiteSpace: "pre-line",
                width: RAIL_W,
              }}
            >
              {note}
            </p>
          )}
          {/* The studio's own guidance, under the measured facts above it. */}
          {sectionId && (
            <SectionNote
              sectionId={sectionId}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 22,
                lineHeight: 1.4,
                letterSpacing: "-0.04em",
                color: pal.textMuted,
                width: RAIL_W,
              }}
            />
          )}
        </div>
        {markUrl && (
          // A 10%-opacity watermark, so no plate — a plate here would be a
          // bright rectangle on the rail. It goes through BrandMark for the
          // reversal rule only: a mono mark may flip, a coloured one may not.
          <BrandMark
            src={markUrl}
            alt=""
            onDark={pal.paperIsDark}
            style={{ position: "absolute", bottom: 0, insetInlineStart: 0, width: 80, height: 80, opacity: 0.1 }}
          />
        )}
      </div>

      <div
        style={at(PANEL_X, GUTTER, {
          width: PANEL_W,
          height: PANEL_H,
          borderRadius: 20,
          background: panelBackground ?? pal.panel,
          padding: padded ? GUTTER : undefined,
          overflow: "hidden",
        })}
      >
        {children}
      </div>
    </Slide>
  );
}

/**
 * The SectionOpener master: an oversized title, the chapter numeral in the
 * second accent, a ruled square with the mark ghosted behind it, and the
 * chapter's own contents pinned to the bottom.
 */
export function SectionOpenerSlide({
  scale,
  pal,
  numeral,
  titleLines,
  items,
  markUrl,
  isAr,
}: {
  scale: number;
  pal: DeckPalette;
  numeral: string;
  /** Two lines, as the source sets them — stacked, not wrapped. */
  titleLines: [string, string];
  items: string[];
  markUrl?: string;
  isAr: boolean;
}) {
  return (
    <Slide scale={scale} background={pal.paper} label={`${numeral} ${titleLines.join(" ")}`}>
      <div
        style={at(GUTTER_WIDE, GUTTER_WIDE, {
          width: 1163,
          height: 880,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        })}
      >
        <h2
          dir="auto"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 180,
            lineHeight: 1.1,
            color: pal.primary,
            letterSpacing: isAr ? "normal" : undefined,
          }}
        >
          {titleLines[0]}
          <br />
          {titleLines[1]}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {items.map((item) => (
            <span
              key={item}
              dir="auto"
              style={{ fontFamily: "var(--font-sans)", fontSize: 30, lineHeight: 1.2, letterSpacing: "-0.04em", color: pal.textMuted }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <span
        style={at(1549, GUTTER_WIDE, {
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 180,
          lineHeight: 1.1,
          color: pal.accentNumber,
          whiteSpace: "nowrap",
        })}
      >
        {numeral}
      </span>

      <div style={at(1320, 480, { width: 720, height: 720 })}>
        {markUrl && (
          <BrandMark
            src={markUrl}
            alt=""
            onDark={pal.paperIsDark}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.1 }}
          />
        )}
        {/* The ruled square: 0.5px rules, 6 × 6, drawn as a background so it
            stays crisp at any scale instead of 12 stacked elements. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(to right, ${pal.rule} 0.5px, transparent 0.5px), linear-gradient(to bottom, ${pal.rule} 0.5px, transparent 0.5px)`,
            backgroundSize: "120px 120px",
            boxShadow: `inset 0 0 0 0.5px ${pal.rule}`,
          }}
        />
      </div>
    </Slide>
  );
}

/** A colour cell — swatch, name, hex chip. */
export function SwatchCard({
  pal,
  name,
  hex,
  height,
  isPrimary,
  isAr,
}: {
  pal: DeckPalette;
  name: string;
  hex: string;
  height: number;
  isPrimary?: boolean;
  isAr: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height }}>
      <div style={{ flex: 1, borderRadius: 10, background: hex, boxShadow: `inset 0 0 0 1px ${pal.hairline}` }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span
          dir="auto"
          style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 20, letterSpacing: "-0.04em", color: pal.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {name}
        </span>
        {isPrimary && (
          <span
            style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: pal.primary, flexShrink: 0 }}
          >
            {isAr ? "أساسي" : "PRIMARY"}
          </span>
        )}
      </div>
      <span
        dir="ltr"
        style={{
          fontFamily: "ui-monospace, Menlo, monospace",
          fontSize: 18,
          padding: "6px 12px",
          borderRadius: 4,
          background: pal.chip,
          color: pal.textMuted,
          alignSelf: "flex-start",
        }}
      >
        {hex.toUpperCase()}
      </span>
    </div>
  );
}
