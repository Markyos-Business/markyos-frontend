"use client";

import { BrandMark } from "@/components/ui/media";
import { Asset, LogoSlot, SlotKind, Workspace } from "@/types";
import { bestInkOn } from "@/lib/contrast";
import { getBrandTheme } from "@/components/features/guideline-site/model/theme";
import { colorFormats } from "@/lib/utils";
import { gPlate, gPlateSm } from "@/components/features/guideline-site/components/surface";
import {
  SCRIPTS,
  TYPE_SCALE,
  photoTile,
  readableFileName,
  sampleAt,
  sampleFor,
  swatchEdge,
} from "@/components/features/guideline-site/components/sectionShared";
import { COLOR_FORMATS, columnVars, scriptsFor, type ColorFormatKey, type SectionOptions } from "@/components/features/guideline-site/model/sectionOptions";

/**
 * The alternate layouts for the derived sections — see `lib/sectionVariants.ts`
 * for the list and the reasoning.
 *
 * **Ink on a brand colour is never faded.** Several of these layouts set type
 * directly on a client's own colour, and `bestInkOn` returns the
 * highest-contrast ink available there — so an opacity reduction spends the only
 * margin that exists, and how much of it there was depends on a colour this code
 * has never seen. The first draft faded 9px format labels to 0.6 and measured
 * 3.76:1 against a 4.5 minimum. Hierarchy on a colour ground therefore comes from
 * size, weight and tracking only, which cost nothing legible.
 *
 * Each one draws the same live brand data as the default it sits beside, and
 * styles itself from `--g-*` tokens and the `surface.ts` helpers, so it inherits
 * whichever of the six site templates is active. Nothing here stores anything,
 * and nothing here reads a physical direction: a band's label sits at the
 * *start* of the band, which is its left edge in English and its right in
 * Arabic.
 *
 * The defaults themselves stay in `Content.tsx` beside the components they are
 * built from. Only the alternates are here, which keeps the diff that adds a
 * layout to one file.
 *
 * Every arrangement — here and in `Content.tsx` — puts `data-layout` on its root,
 * carrying the key it is offered under in `sectionVariants`. It costs no DOM and
 * it makes a rendered page say which layout drew each of its sections, which is
 * both what the sweep asserts against and the first thing anyone will want to
 * know when a section looks wrong.
 */

// ---------------------------------------------------------------- colour ---

/**
 * One deep band per colour, its name and value set in the colour's own ink.
 *
 * The palette page every printed brand manual has. Setting the label *in* the
 * colour rather than beneath it is the point: it shows the reader what type looks
 * like on that colour, which is a question they are going to ask anyway.
 */
export function ColorBands({ ws, isAr, opts = {} }: { ws: Workspace; isAr: boolean; opts?: SectionOptions }) {
  const plate = getBrandTheme(ws).surface1;
  // A band prints one value beside the name, so it takes the first format the
  // studio kept rather than always the hex.
  const wanted = opts.formats ?? COLOR_FORMATS;
  return (
    <div data-layout="bands" className="flex flex-col gap-3">
      {ws.colors.map((c) => {
        const ink = bestInkOn(c.hex)?.ink ?? "#000000";
        const shown = colorFormats(c.hex).filter((f) => wanted.includes(f.label as ColorFormatKey))[0];
        return (
          <div
            key={c.id}
            className="flex items-end justify-between gap-4 p-5 h-[108px]"
            style={{ background: c.hex, boxShadow: swatchEdge(c.hex, plate), borderRadius: "var(--g-radius-lg)" }}
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              {c.isPrimary && (
                <span className="text-[9.5px] font-semibold" style={{ letterSpacing: ".1em", color: ink }}>
                  {isAr ? "أساسي" : "PRIMARY"}
                </span>
              )}
              {opts.showNames !== false && (
                <span className="text-[17px] font-semibold truncate" style={{ color: ink }}>
                  {c.name}
                </span>
              )}
            </div>
            {shown && (
              <span
                dir="ltr"
                className="text-[12.5px] shrink-0"
                style={{ fontFamily: "ui-monospace, Menlo, monospace", color: ink }}
              >
                {shown.value}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Small squares, many to a row, with the value beneath.
 *
 * For a palette with a lot in it. The swatch-card layout gives every colour a
 * card the size of a decision, which is right for six colours and wrong for
 * twenty-four — a reader scrolling past eighteen cards to find a tint has lost
 * the shape of the palette, which is the one thing a dense grid shows well.
 */
export function ColorChips({ ws, isAr, opts = {} }: { ws: Workspace; isAr: boolean; opts?: SectionOptions }) {
  const plate = getBrandTheme(ws).surface1;
  const wanted = opts.formats ?? COLOR_FORMATS;
  return (
    <div
      data-layout="chips"
      data-cols={opts.columns ? "" : undefined}
      style={columnVars(opts.columns)}
      className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2.5"
    >
      {ws.colors.map((c) => {
        const shown = colorFormats(c.hex).filter((f) => wanted.includes(f.label as ColorFormatKey))[0];
        return (
          <div key={c.id} className="flex flex-col gap-1.5">
            <div
              className="h-[64px]"
              style={{ background: c.hex, boxShadow: swatchEdge(c.hex, plate), borderRadius: "var(--g-radius-md)" }}
              title={c.isPrimary ? (isAr ? `${c.name} — أساسي` : `${c.name} — primary`) : c.name}
            />
            <div className="flex flex-col">
              {opts.showNames !== false && (
                <span className="text-[10.5px] font-semibold truncate" title={c.name}>
                  {c.name}
                </span>
              )}
              {shown && (
                <span
                  dir="ltr"
                  className="text-[9.5px]"
                  style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--g-text-faint)", textAlign: "start" }}
                >
                  {shown.value}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The primary colour given a block of its own, the rest in a row beneath.
 *
 * A palette is not a flat list — one colour is the brand's and the others support
 * it, and the swatch grid says nothing about that. This says it by size. With no
 * colour marked primary the first is used, because a palette's first entry is
 * where every studio puts the one that matters.
 */
export function ColorFeature({ ws, isAr, opts = {} }: { ws: Workspace; isAr: boolean; opts?: SectionOptions }) {
  if (ws.colors.length === 0) return null;
  const plate = getBrandTheme(ws).surface1;
  const primary = ws.colors.find((c) => c.isPrimary) ?? ws.colors[0];
  const rest = ws.colors.filter((c) => c.id !== primary.id);
  const ink = bestInkOn(primary.hex)?.ink ?? "#000000";
  const wanted = opts.formats ?? COLOR_FORMATS;
  const formats = colorFormats(primary.hex).filter((f) => wanted.includes(f.label as ColorFormatKey));

  return (
    <div data-layout="feature" className="flex flex-col gap-4">
      <div
        className="p-7 flex flex-col justify-end gap-4 min-h-[220px]"
        style={{ background: primary.hex, boxShadow: swatchEdge(primary.hex, plate), borderRadius: "var(--g-radius-lg)" }}
      >
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold" style={{ letterSpacing: ".12em", color: ink }}>
            {isAr ? "اللون الأساسي" : "PRIMARY"}
          </span>
          {opts.showNames !== false && (
            <span className="text-[26px] font-semibold leading-tight" style={{ color: ink }}>
              {primary.name}
            </span>
          )}
        </div>
        {/* The formats inline rather than behind a disclosure: this colour has a
            whole block to itself, so there is room, and the one value a reader
            came for should not need a click. */}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          {formats.map((f) => (
            <span key={f.label} className="flex items-baseline gap-1.5">
              {/* 9.5px rather than 9: this is the smallest type in any of these
                  layouts and it lands on an unknown colour, so it gets the
                  tracking for hierarchy and keeps every bit of its ink. */}
              <span className="text-[9.5px] font-semibold" style={{ letterSpacing: ".08em", color: ink }}>
                {f.label}
              </span>
              <span dir="ltr" className="text-[11.5px]" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: ink }}>
                {f.value}
              </span>
            </span>
          ))}
        </div>
      </div>

      {rest.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {rest.map((c) => {
            const chipInk = bestInkOn(c.hex)?.ink ?? "#000000";
            return (
              <div
                key={c.id}
                className="p-3.5 flex flex-col justify-end h-[104px]"
                style={{ background: c.hex, boxShadow: swatchEdge(c.hex, plate), borderRadius: "var(--g-radius-md)" }}
              >
                {opts.showNames !== false && (
                  <span className="text-[12px] font-semibold truncate" style={{ color: chipInk }}>
                    {c.name}
                  </span>
                )}
                <span
                  dir="ltr"
                  className="text-[10px]"
                  style={{ fontFamily: "ui-monospace, Menlo, monospace", color: chipInk, textAlign: "start" }}
                >
                  {c.hex.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ logo ---

/** The lockups on their own, drawn larger. No construction drawings. */
export function LogoLockups({
  ws,
  attachedSlots,
  onDark,
  opts = {},
}: {
  ws: Workspace;
  attachedSlots: SlotKind[];
  onDark: boolean;
  opts?: SectionOptions;
}) {
  return (
    <div
      data-layout="lockups"
      data-cols={opts.columns ? "" : undefined}
      style={columnVars(opts.columns)}
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      {attachedSlots.map((kind) => (
        <div key={kind} className="p-8 grid place-items-center h-[220px]" style={gPlate}>
          <BrandMark src={ws.logo[kind].url} alt={kind} onDark={onDark} style={{ maxHeight: 110, maxWidth: "100%" }} />
        </div>
      ))}
    </div>
  );
}

/**
 * The primary lockup across the full width, the others in a row below.
 *
 * `primary` is the first attached slot, which is what the rest of the site
 * already treats as primary — the nav mark, the clearspace drawing, the
 * variations strip. A second rule for which lockup leads would be a second
 * answer to the same question.
 */
export function LogoHero({
  ws,
  attachedSlots,
  onDark,
  isAr,
  opts = {},
}: {
  ws: Workspace;
  attachedSlots: SlotKind[];
  onDark: boolean;
  isAr: boolean;
  opts?: SectionOptions;
}) {
  if (attachedSlots.length === 0) return null;
  const [first, ...rest] = attachedSlots;
  const slot: LogoSlot = ws.logo[first];

  return (
    <div data-layout="hero" className="flex flex-col gap-4">
      <div className="p-10 grid place-items-center min-h-[300px]" style={gPlate}>
        <BrandMark src={slot.url} alt={first} onDark={onDark} style={{ maxHeight: 180, maxWidth: "100%" }} />
      </div>
      {rest.length > 0 && (
        <>
          <span className="text-[10px] font-semibold" style={{ letterSpacing: ".1em", textTransform: "uppercase", color: "var(--g-text-faint)" }}>
            {isAr ? "الصيغ الأخرى" : "Other lockups"}
          </span>
          <div
            data-cols={opts.columns ? "" : undefined}
            style={columnVars(opts.columns)}
            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
          >
            {rest.map((kind) => (
              <div key={kind} className="p-6 grid place-items-center h-[140px]" style={gPlateSm}>
                <BrandMark src={ws.logo[kind].url} alt={kind} onDark={onDark} style={{ maxHeight: 64, maxWidth: "100%" }} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------ typography ---

/**
 * Every step as a row: the label, the numbers, and the face set at that size.
 *
 * The specimen shows the face; this shows the *system*. A developer implementing
 * a page needs the size and the line height next to each other in a form they can
 * read off, and the specimen buries those in a caption above each sample.
 */
export function TypeScaleTable({ ws, isAr, opts = {} }: { ws: Workspace; isAr: boolean; opts?: SectionOptions }) {
  const scripts = scriptsFor(opts);
  return (
    <div data-layout="scale" className="flex flex-col gap-4">
      {SCRIPTS.filter((s) => scripts.includes(s.script)).map((s) => (
        <div key={s.script} className="p-5 flex flex-col gap-4" style={gPlate}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[12px] font-semibold" style={{ color: "var(--g-text-muted)" }}>
              {isAr ? s.arLabel : s.label}
            </span>
            <span dir="auto" className="bidi-auto text-[12px] truncate" style={{ color: "var(--g-text-faint)" }}>
              {s.script === "arabic" ? ws.typography.arabicFamily : ws.typography.latinFamily}
            </span>
          </div>

          <div className="flex flex-col">
            {TYPE_SCALE.map((step, i) => (
              <div
                key={step.key}
                className="flex items-baseline gap-4 py-3"
                style={{ boxShadow: i === 0 ? undefined : "inset 0 1px 0 var(--g-hairline)" }}
              >
                {/* Fixed measure so the numbers line up down the column — the
                    whole value of a table over a list. */}
                <span className="shrink-0 w-[92px] flex flex-col gap-0.5">
                  <span className="text-[10.5px] font-semibold" style={{ color: "var(--g-text)" }}>
                    {isAr ? step.arLabel : step.label}
                  </span>
                  <span dir="ltr" className="text-[10px]" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--g-text-faint)", textAlign: "start" }}>
                    {step.size}px / {step.lead}
                  </span>
                </span>
                <span
                  dir={s.dir}
                  className="min-w-0 flex-1 truncate"
                  style={{
                    fontFamily: s.fontFamily,
                    fontSize: Math.min(step.size, 30),
                    lineHeight: step.lead,
                    letterSpacing: s.script === "latin" && step.size > 20 ? "-.02em" : undefined,
                  }}
                >
                  {sampleAt(sampleFor(s.script, s.sample, opts), step.words)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * One large letterform per family, named, with a single line set under it.
 *
 * The least informative typography layout and the most persuasive, which is a
 * real thing a studio sometimes wants: a cover page for the type section rather
 * than a reference for it. The size table is one click away for anyone who needs
 * the numbers.
 */
export function TypePoster({ ws, isAr, opts = {} }: { ws: Workspace; isAr: boolean; opts?: SectionOptions }) {
  const scripts = scriptsFor(opts);
  return (
    <div data-layout="poster" className={`grid gap-4 ${scripts.length > 1 ? "md:grid-cols-2" : "grid-cols-1"}`}>
      {SCRIPTS.filter((s) => scripts.includes(s.script)).map((s) => (
        <div key={s.script} className="p-7 flex flex-col gap-5" style={gPlate}>
          <div
            dir={s.dir}
            className="grid place-items-center min-h-[200px]"
            style={{
              fontFamily: s.fontFamily,
              fontSize: 132,
              lineHeight: 1,
              fontWeight: 500,
              letterSpacing: s.script === "latin" ? "-.04em" : undefined,
            }}
          >
            {s.script === "latin" ? "Aa" : "أب"}
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold" style={{ letterSpacing: ".1em", textTransform: "uppercase", color: "var(--g-text-faint)" }}>
              {isAr ? s.arLabel : s.label}
            </span>
            <span dir="auto" className="bidi-auto text-[18px] font-semibold">
              {s.script === "arabic" ? ws.typography.arabicFamily : ws.typography.latinFamily}
            </span>
            <span
              dir={s.dir}
              className="text-[14px] mt-1"
              style={{ fontFamily: s.fontFamily, lineHeight: 1.6, color: "var(--g-text-muted)" }}
            >
              {sampleAt(sampleFor(s.script, s.sample, opts), 9)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------- photography ---

/** The first photograph runs wide, the rest fill a grid beneath it. */
export function PhotoFeature({ assets, opts = {} }: { assets: Asset[]; opts?: SectionOptions }) {
  if (assets.length === 0) return null;
  const [lead, ...rest] = assets;
  return (
    <div data-layout="feature" className="flex flex-col gap-4">
      {/* The lead image keeps its own tall frame whatever the framing choice —
          that is what makes it the lead. The framing applies to the grid under
          it, where a mixed set of aspect ratios actually shows. */}
      <div className="overflow-hidden h-[320px]" style={gPlate}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={lead.url} alt={lead.fileName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      {rest.length > 0 && (
        <div
          data-cols={opts.columns ? "" : undefined}
          style={columnVars(opts.columns)}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {rest.map((a) => (
            <div key={a.id} className="overflow-hidden h-[110px]" style={gPlateSm}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.url} alt={a.fileName} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** One photograph per row, edge to edge. */
export function PhotoStrip({ assets, opts = {} }: { assets: Asset[]; opts?: SectionOptions }) {
  // Taller than the grid's tiles, because a full-width row is the layout you
  // choose when the photograph is the point. `original` still means uncropped.
  const tile = photoTile(opts.aspect);
  const height = opts.aspect === "original" ? undefined : Math.max(tile.height ?? 0, 260);
  return (
    <div data-layout="strip" className="flex flex-col gap-4">
      {assets.map((a) => (
        <div key={a.id} className="overflow-hidden" style={{ ...gPlate, height }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={a.url}
            alt={a.fileName}
            loading="lazy"
            style={{ width: "100%", height: height ? "100%" : "auto", objectFit: tile.fit, display: "block" }}
          />
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------- icons ---

/**
 * Each tile captioned with its file name.
 *
 * So a developer can ask for one by name. The plain tile grid shows a reader what
 * the set looks like and gives them no way to refer to anything in it.
 */
export function IconNamed({ assets, onDark, opts = {} }: { assets: Asset[]; onDark: boolean; opts?: SectionOptions }) {
  return (
    <div
      data-layout="named"
      data-cols={opts.columns ? "" : undefined}
      style={columnVars(opts.columns)}
      className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3"
    >
      {assets.map((a) => (
        <figure key={a.id} className="flex flex-col gap-1.5 m-0">
          <div className="grid place-items-center h-[84px]" style={gPlateSm}>
            <BrandMark src={a.url} alt={a.fileName} onDark={onDark} style={{ maxHeight: 34, maxWidth: 34 }} fallbackSize={18} />
          </div>
          <figcaption dir="auto" className="bidi-auto text-[10px] truncate" style={{ color: "var(--g-text-faint)" }} title={a.fileName}>
            {readableFileName(a.fileName)}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/** Smaller tiles, many to a row — for a set of twenty or more. */
export function IconDense({ assets, onDark, opts = {} }: { assets: Asset[]; onDark: boolean; opts?: SectionOptions }) {
  return (
    <div
      data-layout="dense"
      data-cols={opts.columns ? "" : undefined}
      style={columnVars(opts.columns)}
      className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-2"
    >
      {assets.map((a) => (
        <div key={a.id} className="grid place-items-center h-[52px]" style={gPlateSm}>
          <BrandMark src={a.url} alt={a.fileName} onDark={onDark} style={{ maxHeight: 22, maxWidth: 22 }} fallbackSize={13} />
        </div>
      ))}
    </div>
  );
}

// --------------------------------------------------------------- mockups ---

/**
 * The mockup grid at a chosen density.
 *
 * One component rather than three, because the difference genuinely *is* a
 * column count and a height — unlike the colour layouts, where it is a different
 * arrangement of different information. Writing three near-identical components
 * to look symmetrical with the colour section would be three places to fix the
 * next caption bug.
 */
export function MockupRows({ assets, columns, opts = {} }: { assets: Asset[]; columns: 1 | 3; opts?: SectionOptions }) {
  const cls = columns === 1 ? "grid gap-4 grid-cols-1" : "grid gap-3 grid-cols-2 sm:grid-cols-3";
  const height = columns === 1 ? 420 : 170;
  return (
    <div
      data-layout={columns === 1 ? "one-up" : "three-up"}
      data-cols={opts.columns ? "" : undefined}
      style={columnVars(opts.columns)}
      className={cls}
    >
      {assets.map((a) => (
        <figure key={a.id} className="flex flex-col gap-2 m-0">
          <div className="overflow-hidden mk-card" style={{ ...gPlate, height }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.url} alt={a.fileName} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          {opts.showNames !== false && (
            <figcaption dir="auto" className="bidi-auto text-[12px]" style={{ color: "var(--g-text-faint)" }}>
              {readableFileName(a.fileName)}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
