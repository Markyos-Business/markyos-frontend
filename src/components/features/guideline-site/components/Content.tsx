"use client";

import { FormEvent, ReactNode, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useToast, Icon } from "@/components/ui";
import { BrandMark } from "@/components/ui/media";
import { Asset, DepartmentView, LogoSlot, Persona, PinSection, SlotKind, VoiceTrait, Workspace } from "@/types";
import { navMarkSlot } from "@/components/features/guideline-site/model/brandLogo";
import { brandSocialLinks, graphicAssets, handleFromUrl, patternAssets } from "@/components/features/guideline-site/model/guidelineAssets";
import { SectionHeading, SectionNote, useLiveEdit } from "@/components/features/guideline-site/components/LiveEdit";
import { StrategyDocument } from "@/components/features/guideline-site/components/documents/StrategyDocument";
import { DepartmentDocument } from "@/components/features/guideline-site/components/documents/DepartmentDocument";
import { colorFormats, formatRelative } from "@/lib/utils";
import { gCard, gInset, gPlate, gPlateSm } from "@/components/features/guideline-site/components/surface";
import { ARABIC_SAMPLE, LATIN_SAMPLE, TYPE_SCALE, photoTile, sampleAt, swatchEdge } from "@/components/features/guideline-site/components/sectionShared";
import {
  ColorBands,
  ColorChips,
  ColorFeature,
  IconDense,
  IconNamed,
  LogoHero,
  LogoLockups,
  MockupRows,
  PhotoFeature,
  PhotoStrip,
  TypePoster,
  TypeScaleTable,
} from "@/components/features/guideline-site/components/SectionLayouts";
import { resolveVariantKey } from "@/components/features/guideline-site/model/sectionVariants";
import {
  COLOR_FORMATS,
  columnVars,
  resolveOptions,
  scriptsFor,
  type ColorFormatKey,
  type SectionOptions,
} from "@/components/features/guideline-site/model/sectionOptions";
import { getBrandTheme, isLightHex } from "@/components/features/guideline-site/model/theme";

/**
 * Content-only renderers shared by every guideline-site template — each
 * template supplies its own section wrapper/heading style, but the actual
 * grids read from the same live workspace data (colors, logo, typography,
 * assets, strategy) so switching templates never touches content, only
 * presentation.
 *
 * These used to carry fixed corner radii and a fixed surface colour, which is
 * why every template's section bodies looked identical no matter which one was
 * chosen — the shells differed, the content did not. They now style themselves
 * from the design-system tokens the active template mounts, so a colour grid is
 * square and shadowed under Signal and round and filled under Atlas from the
 * same component.
 */

/*
 * `data-layout` on this and the other default arrangements below.
 *
 * It carries the key the arrangement is offered under in `lib/sectionVariants.ts`
 * — see the note at the top of `SectionLayouts.tsx`. These are the defaults, so
 * they are what a section renders when nobody has chosen anything.
 */
export function LogoGrid({
  ws,
  attachedSlots,
  onDark = true,
  opts = {},
}: {
  ws: Workspace;
  attachedSlots: SlotKind[];
  onDark?: boolean;
  opts?: SectionOptions;
}) {
  return (
    <div
      data-layout="full"
      data-cols={opts.columns ? "" : undefined}
      style={columnVars(opts.columns)}
      className="grid grid-cols-2 sm:grid-cols-3 gap-4"
    >
      {attachedSlots.map((kind) => {
        const slot = ws.logo[kind];
        return (
          <div key={kind} className="p-6 grid place-items-center h-[160px]" style={gPlate}>
            <BrandMark src={slot.url} alt={kind} onDark={onDark} style={{ maxHeight: 72, maxWidth: "100%" }} />
          </div>
        );
      })}
    </div>
  );
}

export function ClearspaceCaption({ ws, attachedSlots, isAr }: { ws: Workspace; attachedSlots: SlotKind[]; isAr: boolean }) {
  if (attachedSlots.length === 0) return null;
  const value = ws.logo[attachedSlots[0]].clearspaceMultiplier;
  return (
    <p className="text-[12px]" style={{ color: "var(--g-text-faint)" }}>
      {isAr ? `المسافة الآمنة الدنيا: ${value}× ارتفاع الشعار من كل جانب.` : `Minimum clearspace: ${value}× the mark's height on every side.`}
    </p>
  );
}

/**
 * The clearspace rule, drawn rather than described.
 *
 * The section already carried the number as a sentence, which is the part of a
 * logo chapter nobody reads and everybody gets wrong. The rectangle is the
 * actual instruction: the mark at a known height with the stored multiplier
 * applied as real padding on all four sides, so the margin a reader sees is the
 * margin the workspace stores. Change the multiplier on the Logo page and this
 * diagram changes with it — there is no second copy of the number here.
 */
const CLEARSPACE_MARK = 68;

export function ClearspaceDiagram({ slot, onDark, isAr }: { slot: LogoSlot; onDark: boolean; isAr: boolean }) {
  const pad = Math.round(CLEARSPACE_MARK * slot.clearspaceMultiplier);
  return (
    <div className="p-8 flex flex-col items-center gap-4" style={gPlate}>
      <div
        className="flex items-center justify-center"
        style={{ padding: pad, outline: "1px dashed var(--g-accent)", outlineOffset: -1 }}
      >
        {/* An explicit height, not a max-height: neither axis of this box is
            definite, and a replaced element constrained only by max-* inside an
            auto-sized box lays out at zero. */}
        <BrandMark src={slot.url} lightSrc={slot.lightUrl} alt="" onDark={onDark} style={{ height: CLEARSPACE_MARK, width: "auto" }} />
      </div>
      <span className="text-[11px] text-center" style={{ color: "var(--g-text-faint)" }}>
        {isAr
          ? `المساحة المتقطعة = ${slot.clearspaceMultiplier}× ارتفاع الشعار. لا شيء يدخل داخلها.`
          : `The dashed margin is ${slot.clearspaceMultiplier}× the mark's height. Nothing enters it.`}
      </span>
    </div>
  );
}

/**
 * The lockup on each ground it is allowed on.
 *
 * Every tile is a real ground this theme produces — the page, a surface, the
 * accent, the inverted ground the two-tone templates use for their openers — so
 * a studio can see at a glance whether its mark survives its own palette. The
 * reversed artwork is used wherever one was uploaded; where it wasn't, the mark
 * is drawn as supplied, which is the honest answer to "what happens on dark".
 */
export function LogoVariations({ ws, slot, isAr }: { ws: Workspace; slot: LogoSlot; isAr: boolean }) {
  const theme = getBrandTheme(ws);
  const grounds: { key: string; label: string; arLabel: string; bg: string; edge: boolean }[] = [
    { key: "canvas", label: "On the page", arLabel: "على الصفحة", bg: theme.canvas, edge: true },
    { key: "surface", label: "On a surface", arLabel: "على سطح", bg: theme.surface2, edge: true },
    { key: "accent", label: "On the accent", arLabel: "على اللون المميز", bg: theme.accent, edge: false },
    { key: "invert", label: "Reversed", arLabel: "معكوس", bg: theme.invertBg, edge: false },
  ];
  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {grounds.map((g) => (
        <figure key={g.key} className="flex flex-col gap-2 m-0">
          <div
            className="grid place-items-center h-[110px] px-4 overflow-hidden"
            style={{
              background: g.bg,
              borderRadius: "var(--g-radius-lg)",
              boxShadow: g.edge ? "inset 0 0 0 1px var(--g-hairline)" : "none",
            }}
          >
            <BrandMark src={slot.url} lightSrc={slot.lightUrl} alt="" onDark={!isLightHex(g.bg)} style={{ maxHeight: 44, maxWidth: "100%" }} />
          </div>
          <figcaption className="text-[11px]" style={{ color: "var(--g-text-faint)" }}>
            {isAr ? g.arLabel : g.label}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/**
 * What must not be done to the mark — demonstrated on the brand's own artwork.
 *
 * Every tile is this brand's real lockup with one prohibited transform applied
 * in CSS, not stock illustration of somebody else's logo. That matters: a
 * reader recognises "stretched" far faster on the mark they are about to
 * misuse, and the page stays correct for every brand without anyone drawing
 * six new images per client.
 *
 * The rules themselves are the ones that hold for any logo — proportion,
 * colour, orientation, effects, crowding — which is why they can be stated
 * without a studio having to type them. Anything brand-specific belongs in the
 * section note, where the studio writes in its own words.
 */
const MISUSE: { key: string; label: string; arLabel: string; css: React.CSSProperties; crowd?: boolean }[] = [
  { key: "stretch", label: "Don't stretch or squash it", arLabel: "لا تمدّه أو تضغطه", css: { transform: "scaleX(1.5)" } },
  { key: "rotate", label: "Don't rotate it", arLabel: "لا تُدِرْه", css: { transform: "rotate(-12deg)" } },
  {
    key: "recolour",
    label: "Don't recolour it",
    arLabel: "لا تغيّر ألوانه",
    // A hue rotation alone is a no-op on a black or white mark — which is most
    // marks — so the demonstration would have shown a correct logo captioned
    // "don't recolour". The invert lifts the artwork off the extremes first,
    // and the sepia/saturate pair then carries it somewhere it plainly
    // shouldn't be, whatever colours it arrived in.
    css: { filter: "invert(48%) sepia(92%) saturate(1800%) hue-rotate(86deg) brightness(105%)" },
  },
  { key: "fade", label: "Don't fade or outline it", arLabel: "لا تُبهته أو تحوّله إلى حدود", css: { opacity: 0.32 } },
  {
    key: "effects",
    label: "Don't add effects",
    arLabel: "لا تُضِف تأثيرات",
    // Blur as well as a shadow: a dark shadow under a dark mark is invisible,
    // and this tile has to read as wrong for every brand, not just pale ones.
    css: { filter: "blur(1.3px) drop-shadow(4px 5px 3px rgba(0,0,0,.45))" },
  },
  { key: "crowd", label: "Don't crowd it", arLabel: "لا تزاحمه", css: {}, crowd: true },
];

export function MisuseGrid({ slot, onDark, isAr }: { slot: LogoSlot; onDark: boolean; isAr: boolean }) {
  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
      {MISUSE.map((rule) => (
        <figure key={rule.key} className="flex flex-col gap-2 m-0">
          <div className="relative grid place-items-center h-[130px] px-5 overflow-hidden" style={gPlate}>
            {rule.crowd && (
              // A block shoved against the mark — the clearspace rule broken,
              // rather than a caption saying it was.
              <span
                aria-hidden
                className="absolute top-1/2 -translate-y-1/2 h-[46px] w-[30%]"
                style={{ insetInlineEnd: "14%", background: "var(--g-text-faint)", borderRadius: "var(--g-radius-sm)" }}
              />
            )}
            {/* The treatment goes on a wrapper, not on the mark's own style:
                BrandMark writes `filter` itself (that is how it reverses a
                mono mark) and would overwrite anything passed in — which made
                two of these tiles show a perfectly correct logo under a
                caption saying not to do that. */}
            <span className="inline-block" style={rule.css}>
              {/* Explicit height, auto width — see ClearspaceDiagram: a
                  shrink-to-fit wrapper gives a max-height-only image no box to
                  resolve against and it lays out at zero. */}
              <BrandMark src={slot.url} lightSrc={slot.lightUrl} alt="" onDark={onDark} style={{ height: 40, width: "auto", display: "block" }} />
            </span>
            <span
              aria-hidden
              className="absolute top-2.5 grid place-items-center w-5 h-5 rounded-full text-[11px] font-bold"
              style={{ insetInlineEnd: 10, background: "var(--danger)", color: "var(--danger-ink)" }}
            >
              ✕
            </span>
          </div>
          <figcaption className="text-[11.5px]" style={{ color: "var(--g-text-muted)" }}>
            {isAr ? rule.arLabel : rule.label}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/**
 * The mark as an app icon and a favicon.
 *
 * Only the symbol is used, because the sizes below are exactly where a full
 * lockup stops being legible — which is the rule this section exists to state.
 * The browser-tab strip shows the workspace's own custom domain when one has
 * been set and the brand's name otherwise; inventing a plausible domain would
 * put a URL the client does not own into their own guideline.
 */
const ICON_SIZES = [64, 48, 32, 16];

export function AppIconGrid({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const slot = navMarkSlot(ws);
  const theme = getBrandTheme(ws);
  const onAccent = !isLightHex(theme.accent);
  const domain = ws.clientAccess.customDomain.trim();

  return (
    <div className="flex flex-col gap-5">
      <div className="p-6 flex flex-wrap items-end gap-5" style={gPlate}>
        {ICON_SIZES.map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <div
              className="grid place-items-center overflow-hidden"
              style={{ width: s, height: s, background: theme.accent, borderRadius: Math.max(2, Math.round(s * 0.22)) }}
            >
              {slot ? (
                <BrandMark src={slot.url} lightSrc={slot.lightUrl} alt="" onDark={onAccent} style={{ width: s * 0.58, height: s * 0.58 }} fallbackSize={Math.round(s * 0.4)} />
              ) : (
                <span className="font-semibold" style={{ fontSize: s * 0.36, color: "var(--g-accent-ink)" }}>{ws.initials}</span>
              )}
            </div>
            <span className="text-[10px]" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--g-text-faint)" }}>
              {s}px
            </span>
          </div>
        ))}
        <span className="text-[12px] self-center" style={{ color: "var(--g-text-muted)" }}>
          {isAr ? "الرمز وحده عند الأحجام الصغيرة — بدون اسم العلامة." : "Symbol only at these sizes — never the full lockup."}
        </span>
      </div>

      {/* The favicon in the one place a favicon is ever seen. */}
      <div className="p-4 flex items-center gap-2" style={gPlate}>
        <div className="flex items-center gap-2 px-3 py-2 min-w-0 max-w-[340px]" style={{ ...gInset, background: "var(--g-surface-1)" }}>
          <span className="w-4 h-4 grid place-items-center shrink-0 overflow-hidden" style={{ background: theme.accent, borderRadius: 3 }}>
            {slot && <BrandMark src={slot.url} lightSrc={slot.lightUrl} alt="" onDark={onAccent} style={{ width: 10, height: 10 }} fallbackSize={7} />}
          </span>
          <span dir="auto" className="bidi-auto text-[12px] truncate">{ws.name}</span>
          <Icon name="times" size={10} style={{ color: "var(--g-text-faint)", flexShrink: 0 }} />
        </div>
        {domain && (
          <span dir="ltr" className="text-[11px] truncate" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--g-text-faint)" }}>
            {domain}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Repeating artwork, shown as both the tile and the repeat.
 *
 * Two views because they answer different questions: the tile is the file a
 * designer places, and the repeat is what it becomes once it is laid edge to
 * edge — where a seam shows up, if there is one. The repeat is drawn at the
 * file's own pixel size rather than scaled to fit, so what is on screen is the
 * artwork's real scale and not a flattering one.
 */
export function PatternGrid({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const patterns = patternAssets(ws);
  const graphics = graphicAssets(ws);

  return (
    <div className="flex flex-col gap-5">
      {patterns.map((a) => (
        <figure key={a.id} className="flex flex-col gap-2 m-0">
          <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
            <div className="grid place-items-center h-[160px] p-3 overflow-hidden" style={gPlate}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.url} alt={a.fileName} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
            <div
              className="h-[160px] overflow-hidden"
              style={{ ...gPlate, backgroundImage: `url(${a.url})`, backgroundRepeat: "repeat" }}
            />
          </div>
          <figcaption dir="auto" className="bidi-auto text-[11.5px]" style={{ color: "var(--g-text-faint)" }}>
            {a.fileName.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]/g, " ")} · {isAr ? "البلاطة والتكرار" : "tile and repeat"}
          </figcaption>
        </figure>
      ))}

      {graphics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {graphics.map((a) => (
            <div key={a.id} className="grid place-items-center h-[130px] p-4 overflow-hidden" style={gPlate}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.url} alt={a.fileName} loading="lazy" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The brand's own social profiles, previewed.
 *
 * Every account shown is one the studio entered on a socialLinks block, and the
 * handle is read out of that URL rather than derived from the workspace slug —
 * a guessed handle reads exactly like a real one and a client copying it out of
 * their guideline has no way to tell. The avatar and header are drawn from the
 * live mark and palette, so a palette change updates every profile here.
 */
export function SocialProfiles({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const links = brandSocialLinks(ws);
  const slot = navMarkSlot(ws);
  const theme = getBrandTheme(ws);
  const onInvert = !isLightHex(theme.invertBg);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {links.map((l) => {
        const handle = handleFromUrl(l.url);
        return (
          <a
            key={l.id}
            href={l.url}
            target="_blank"
            rel="noreferrer noopener"
            className="overflow-hidden block"
            style={gPlate}
          >
            {/* The cover band every profile page has, in the brand's own dark. */}
            <div className="h-[56px]" style={{ background: theme.invertBg }} />
            <div className="px-4 pb-4 -mt-6 flex flex-col gap-1">
              <span
                className="w-12 h-12 grid place-items-center overflow-hidden"
                style={{ background: theme.accent, borderRadius: "var(--g-radius-md)", boxShadow: `0 0 0 3px ${theme.invertBg}` }}
              >
                {slot ? (
                  <BrandMark src={slot.url} lightSrc={slot.lightUrl} alt="" onDark={onInvert} style={{ width: 24, height: 24 }} fallbackSize={14} />
                ) : (
                  <span className="text-[13px] font-semibold" style={{ color: "var(--g-accent-ink)" }}>{ws.initials}</span>
                )}
              </span>
              <span dir="auto" className="bidi-auto font-semibold text-[14px] mt-1.5 truncate">{ws.name}</span>
              <span dir="ltr" className="text-[11.5px] truncate" style={{ color: "var(--g-text-faint)" }}>
                {handle ? `${handle} · ${l.platform}` : l.platform}
              </span>
            </div>
          </a>
        );
      })}
      <p className="text-[11.5px] sm:col-span-2" style={{ color: "var(--g-text-faint)" }}>
        {isAr
          ? "الصورة الرمزية هي الرمز فقط على اللون المميز، والغلاف باللون الداكن للعلامة."
          : "The avatar is the symbol on the accent; the header is the brand's own dark."}
      </p>
    </div>
  );
}

/**
 * The palette, with every notation a reader might actually need to paste.
 *
 * Copying only the hex covered the developer opening this page and nobody
 * else — the print supplier needs CMYK and a CSS author often wants HSL to
 * derive a tint. Expanding a swatch lists all four, each copyable on its own,
 * and the CMYK row says outright that it is an approximation.
 */
/**
 * A border for a swatch, drawn in the swatch's own readable ink.
 *
 * A fixed grey hairline works for mid-tones and fails at exactly the two
 * places a palette needs it most: a near-black swatch on a dark plate and a
 * white swatch on a light one, where the chip loses its edges and a reader
 * can't see where the colour starts. Taking the ink from the swatch itself
 * means the edge is always the opposite of what it borders, so every swatch
 * reads as a swatch — including #FFFFFF and #000000, which are real entries in
 * most palettes.
 */
export function ColorGrid({ ws, isAr, opts = {} }: { ws: Workspace; isAr: boolean; opts?: SectionOptions }) {
  const { showToast } = useToast();
  const [openId, setOpenId] = useState<string | null>(null);
  // Which formats the studio asked for, in the canonical order rather than the
  // order they happened to tick them in.
  const wanted = opts.formats ?? COLOR_FORMATS;
  // The plate each chip is drawn on, so a chip that matches it can be given a
  // harder edge. Same source the CSS token comes from, so the two can't drift.
  const plate = getBrandTheme(ws).surface1;

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      showToast(isAr ? `تم نسخ ${label}` : `Copied ${label} — ${value}`, "success");
    } catch {
      // Clipboard blocked (insecure context, or permission denied). The value
      // is on screen and selectable, so this is a convenience that failed,
      // not a loss of information.
      showToast(isAr ? "المتصفح منع النسخ — القيمة ظاهرة للتحديد." : "The browser blocked copying — the value is on screen to select.", "danger");
    }
  }

  // Four swatches only once there is room for the hex and the CODES toggle
  // side by side; at 390px a quarter-width card clips the toggle.
  return (
    <div
      data-layout="cards"
      data-cols={opts.columns ? "" : undefined}
      style={columnVars(opts.columns)}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      {ws.colors.map((c) => {
        const open = openId === c.id;
        const formats = colorFormats(c.hex).filter((f) => wanted.includes(f.label as ColorFormatKey));
        return (
          <div key={c.id} className="overflow-hidden" style={gPlate}>
            {/*
             * The card stops being a button when there is nothing to disclose.
             * A studio can turn every value format off — a palette page that is
             * swatches and names and nothing else is a real design — and a
             * control that opens an empty drawer would be worse than no control.
             */}
            {(() => {
              const body = (
                <>
                  <div className="h-[104px]" style={{ background: c.hex, boxShadow: swatchEdge(c.hex, plate) }} />
                  <div className="px-3.5 py-3 flex flex-col gap-1.5">
                    {(opts.showNames !== false || c.isPrimary) && (
                      <div className="flex items-center justify-between gap-1.5">
                        {opts.showNames !== false && <span className="font-semibold text-[13px] truncate">{c.name}</span>}
                        {c.isPrimary && (
                          <span className="text-[9px] font-semibold px-1.5 py-[3px] rounded shrink-0" style={{ background: "var(--g-accent-soft)", color: "var(--g-accent-on-soft)" }}>
                            {isAr ? "أساسي" : "PRIMARY"}
                          </span>
                        )}
                      </div>
                    )}
                    {formats.length > 0 && (
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[11px]" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--g-text-muted)" }}>
                          {/* The first format the studio kept, not always the hex
                              — turning HEX off and still printing it would make
                              the control a lie. */}
                          {formats[0].value}
                        </span>
                        {formats.length > 1 && (
                          <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: "var(--g-accent)" }}>
                            {open ? (isAr ? "إخفاء" : "HIDE") : isAr ? "الصيغ" : "CODES"}
                            <Icon name={open ? "angle-up" : "angle-down"} size={10} />
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </>
              );
              if (formats.length < 2) return <div className="w-full text-start">{body}</div>;
              return (
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : c.id)}
                  aria-expanded={open}
                  className="w-full text-start cursor-pointer"
                >
                  {body}
                </button>
              );
            })()}

            {open && (
              <div className="px-3.5 pb-3 flex flex-col gap-1.5">
                {formats.map((f) => {
                  const row = (
                    <>
                      <span className="text-[9.5px] font-semibold shrink-0 w-[38px]" style={{ letterSpacing: ".06em", color: "var(--g-text-faint)" }}>
                        {f.label}
                      </span>
                      <span dir="ltr" className="flex-1 min-w-0 truncate text-[11px]" style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>
                        {f.value}
                      </span>
                      {opts.enableCopy !== false && <Icon name="copy" size={11} style={{ color: "var(--g-text-faint)", flexShrink: 0 }} />}
                    </>
                  );
                  // With copying off the row is still worth showing and still
                  // worth selecting by hand — it just stops claiming to be a
                  // button, since a button that does nothing is the thing the
                  // studio turned off.
                  return opts.enableCopy === false ? (
                    <div key={f.label} className="flex items-center gap-2 px-2.5 py-2" style={gInset}>
                      {row}
                    </div>
                  ) : (
                    <button
                      key={f.label}
                      type="button"
                      onClick={() => copy(f.label, f.value)}
                      title={isAr ? `نسخ ${f.label}` : `Copy ${f.label}`}
                      className="flex items-center gap-2 px-2.5 py-2 cursor-pointer text-start"
                      style={gInset}
                    >
                      {row}
                    </button>
                  );
                })}
                {formats.some((f) => f.note) && (
                  <span className="text-[10px] leading-[1.4]" style={{ color: "var(--g-text-faint)" }}>
                    {isAr ? formats.find((f) => f.arNote)?.arNote : formats.find((f) => f.note)?.note}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * The type specimen.
 *
 * This used to print "Aa Bb" and the family name, which tells a reader almost
 * nothing: a designer picking type off a guideline needs to see the character
 * set, the face set in a real sentence, and the sizes the brand actually uses
 * with their line heights — that last part is what stops six people inventing
 * six different heading sizes. Each script gets the same treatment, because a
 * bilingual brand's Arabic is not a footnote to its Latin.
 *
 * No new stored data: a specimen is the face rendered at known sizes, and the
 * face is already applied through the brand-font custom properties.
 */
function ScriptSpecimen({
  script,
  label,
  family,
  fontFamily,
  showing,
  characters,
  sample,
  isAr,
  opts = {},
}: {
  script: "latin" | "arabic";
  label: string;
  family: string;
  fontFamily: string;
  showing: string;
  characters: string;
  sample: string;
  isAr: boolean;
  opts?: SectionOptions;
}) {
  const dir = script === "arabic" ? "rtl" : "ltr";
  return (
    <div className="p-6 flex flex-col gap-5" style={gPlate}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12px] font-semibold" style={{ color: "var(--g-text-muted)" }}>{label}</span>
        <span dir="auto" className="bidi-auto text-[12px] truncate" style={{ color: "var(--g-text-faint)" }}>{family}</span>
      </div>

      <div dir={dir} style={{ fontFamily, fontSize: 64, lineHeight: 1.05, letterSpacing: script === "latin" ? "-.03em" : undefined, fontWeight: 500 }}>
        {showing}
      </div>

      {/* The character set: what the face actually gives you to work with. */}
      {opts.showCharacterSet !== false && (
        <div
          dir={dir}
          style={{ fontFamily, fontSize: 14, lineHeight: 1.9, color: "var(--g-text-muted)", wordSpacing: script === "arabic" ? "0.15em" : undefined }}
        >
          {characters}
        </div>
      )}

      {/* The rule only earns its place between two things. With the character set
          or the scale turned off it would be a line under the last element. */}
      {opts.showCharacterSet !== false && opts.showScale !== false && (
        <div style={{ height: 1, background: "var(--g-hairline)" }} />
      )}

      {/* The scale, with the line heights — the part that keeps six people from
          inventing six different heading sizes. */}
      {opts.showScale !== false && (
      <div className="flex flex-col gap-3.5">
        {TYPE_SCALE.map((step) => (
          <div key={step.key} className="flex flex-col gap-1">
            <span
              className="text-[10px] font-semibold"
              style={{ letterSpacing: ".1em", textTransform: "uppercase", color: "var(--g-text-faint)" }}
            >
              {isAr ? step.arLabel : step.label} · {step.size}/{step.lead}
            </span>
            <span
              dir={dir}
              className="block"
              style={{ fontFamily, fontSize: step.size, lineHeight: step.lead, letterSpacing: script === "latin" && step.size > 20 ? "-.02em" : undefined }}
            >
              {sampleAt(sample, step.words)}
            </span>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

export function TypeSpecimen({ ws, isAr, opts = {} }: { ws: Workspace; isAr: boolean; opts?: SectionOptions }) {
  const scripts = scriptsFor(opts);
  return (
    <div
      data-layout="specimen"
      // One script fills the width rather than leaving half the section empty.
      className={`grid gap-4 ${scripts.length > 1 ? "md:grid-cols-2" : "grid-cols-1"}`}
    >
      {scripts.includes("latin") && (
        <ScriptSpecimen
          script="latin"
          label={isAr ? "لاتيني" : "Latin"}
          family={ws.typography.latinFamily}
          fontFamily="var(--font-sans)"
          showing="Aa Bb Cc"
          characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789"
          sample={opts.sampleText?.trim() || LATIN_SAMPLE}
          isAr={isAr}
          opts={opts}
        />
      )}
      {scripts.includes("arabic") && (
        <ScriptSpecimen
          script="arabic"
          label={isAr ? "عربي" : "Arabic"}
          family={ws.typography.arabicFamily}
          fontFamily="var(--font-arabic)"
          showing="أ ب ج"
          characters="ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي ٠١٢٣٤٥٦٧٨٩"
          sample={opts.sampleTextAr?.trim() || ARABIC_SAMPLE}
          isAr={isAr}
          opts={opts}
        />
      )}
    </div>
  );
}

export function PhotoGrid({ assets, opts = {} }: { assets: Asset[]; opts?: SectionOptions }) {
  const tile = photoTile(opts.aspect);
  return (
    <div
      data-layout="grid"
      data-cols={opts.columns ? "" : undefined}
      style={columnVars(opts.columns)}
      className="grid grid-cols-2 sm:grid-cols-3 gap-4"
    >
      {assets.map((a) => (
        <div key={a.id} className="overflow-hidden" style={{ ...gPlate, height: tile.height }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={a.url}
            alt={a.fileName}
            loading="lazy"
            style={{ width: "100%", height: tile.height ? "100%" : "auto", objectFit: tile.fit, display: "block" }}
          />
        </div>
      ))}
    </div>
  );
}

export function IconGrid({ assets, onDark = true, opts = {} }: { assets: Asset[]; onDark?: boolean; opts?: SectionOptions }) {
  return (
    <div
      data-layout="grid"
      data-cols={opts.columns ? "" : undefined}
      style={columnVars(opts.columns)}
      className="grid grid-cols-4 sm:grid-cols-6 gap-3"
    >
      {assets.map((a) => (
        <div key={a.id} className="grid place-items-center h-[72px]" style={gPlateSm}>
          <BrandMark src={a.url} alt={a.fileName} onDark={onDark} style={{ maxHeight: 28, maxWidth: 28 }} fallbackSize={16} />
        </div>
      ))}
    </div>
  );
}

export function PersonaGrid({ personas }: { personas: Persona[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {personas.map((p) => (
        <div key={p.id} className="p-5 flex flex-col gap-1.5" style={gCard}>
          <span className="font-semibold text-[14px]">{p.name}</span>
          <span className="text-[12px]" style={{ color: "var(--g-accent)" }}>{p.role}</span>
          <p className="text-[13px] mt-1" style={{ color: "var(--g-text-muted)" }}>{p.description}</p>
        </div>
      ))}
    </div>
  );
}

export function VoiceList({ traits, isAr }: { traits: VoiceTrait[]; isAr: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {traits.map((t) => (
        <div key={t.id} className="p-5" style={gCard}>
          {/* Trait name and both examples are author-written and may be in
              either script regardless of the page language, so each picks its
              own base direction rather than inheriting the page's. */}
          <span dir="auto" className="bidi-auto font-semibold text-[13px]" style={{ color: "var(--g-accent)" }}>{t.trait}</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2.5">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase" style={{ color: "var(--success)" }}>{isAr ? "افعل" : "Do"}</span>
              <span dir="auto" className="bidi-auto text-[13px]" style={{ color: "var(--g-text-muted)" }}>{t.doExample}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase" style={{ color: "var(--danger)" }}>{isAr ? "لا تفعل" : "Don't"}</span>
              <span dir="auto" className="bidi-auto text-[13px]" style={{ color: "var(--g-text-muted)" }}>{t.dontExample}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The brand's strategy, on the client-facing site.
 *
 * Exactly the document the studio proofreads in the hub's read view — same
 * component, guideline tokens — minus the two chapters this site already
 * gives sections of their own, so nothing is printed twice.
 */
export function StrategySection({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  return (
    <StrategyDocument
      ws={ws}
      isAr={isAr}
      surface="guideline"
      idPrefix="strategy-doc-"
      omitChapters={["tone"]}
      showPersonaCards={false}
    />
  );
}

/**
 * Every published department's instruction page, as one navigable section.
 *
 * Collapsed by default with the first one open: a reader came for their own
 * department, not for all of them, and five expanded handbooks would bury the
 * rest of the guideline.
 */
export function DepartmentsSection({
  ws,
  departments,
  isAr,
}: {
  ws: Workspace;
  departments: DepartmentView[];
  isAr: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(departments[0]?.id ?? null);

  return (
    <div className="flex flex-col gap-2.5">
      {departments.map((d) => {
        const open = openId === d.id;
        return (
          <div key={d.id} className="overflow-hidden" style={gCard}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : d.id)}
              aria-expanded={open}
              className="w-full flex items-center gap-3 px-5 py-4 cursor-pointer text-start"
            >
              <Icon name="book" size={15} style={{ color: "var(--g-accent)", flexShrink: 0 }} />
              <span dir="auto" className="bidi-auto flex-1 font-semibold text-[15px]">
                {d.name}
              </span>
              <span className="text-[11px]" style={{ color: "var(--g-text-faint)" }}>
                {d.instructionSections.length > 0
                  ? isAr
                    ? `${d.instructionSections.length} قسم`
                    : `${d.instructionSections.length} section${d.instructionSections.length === 1 ? "" : "s"}`
                  : ""}
              </span>
              <Icon name={open ? "angle-up" : "angle-down"} size={13} style={{ color: "var(--g-text-faint)" }} />
            </button>
            {open && (
              <div className="px-5 pb-6 pt-1">
                <DepartmentDocument ws={ws} view={d} isAr={isAr} surface="guideline" idPrefix={`dept-${d.id}-`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * The one sentence a guideline opens on, as a section of its own.
 *
 * Its text defaults to the brand's mission but is stored as this section's own
 * heading, so rewriting the cover line here doesn't rewrite the mission
 * statement in the Strategy hub — a studio usually wants the two to differ, and
 * previously the band simply printed the mission with no way to say anything
 * else.
 *
 * Each template passes its own band styling; only the behaviour is shared. With
 * nothing written it renders on the editing canvas (as the place to write one)
 * and nowhere else, so an unused statement never publishes as an empty stripe.
 */
export function StatementBand({
  text,
  isAr,
  className,
  style,
  textClassName,
  textStyle,
  noteStyle,
}: {
  text: string;
  isAr: boolean;
  className?: string;
  style?: React.CSSProperties;
  textClassName?: string;
  textStyle?: React.CSSProperties;
  noteStyle?: React.CSSProperties;
}) {
  const { enabled } = useLiveEdit();
  if (!text && !enabled) return null;
  return (
    // The anchor is not decoration: this section takes a numbered place in the
    // contents, and scroll-spy and the jump links both find sections by id.
    // Without it, clicking "Statement" in the contents scrolls nowhere.
    <div id="statement" className={`scroll-mt-0 ${className ?? ""}`} style={style}>
      {/* Stored against its own id, not the section's. The section id is what
          the contents list is labelled from, so writing a whole sentence of
          statement into it would retitle the contents entry to that sentence
          — the same trap the hero headline avoids. */}
      <SectionHeading
        sectionId="statement-text"
        as="span"
        value={text}
        placeholder={isAr ? "اكتب عبارة الافتتاح" : "Write the opening statement"}
        className={textClassName}
        style={{ display: "block", ...textStyle }}
      />
      <SectionNote
        sectionId="statement"
        placeholder={isAr ? "أضف سطرًا داعمًا" : "Add a supporting line"}
        className="text-[14px] leading-[1.6] mt-2.5"
        style={noteStyle}
      />
    </div>
  );
}

/**
 * Everything a derived section needs to draw itself, gathered once by the
 * template instead of threaded through as eight separate props per section.
 */
export interface FixedSectionContext {
  ws: Workspace;
  isAr: boolean;
  onDark: boolean;
  attachedSlots: SlotKind[];
  photoAssets: Asset[];
  iconAssets: Asset[];
  mockupAssets: Asset[];
  publishedDepartments: DepartmentView[];
}

/**
 * The brand applied to real things.
 *
 * Shown larger than the photography grid and captioned with each file's name,
 * because a mockup is evidence — "here is the logo at this size on this
 * surface" — and a reader needs to be able to say which one they mean.
 *
 * Planned: generated mockups. The seam is the asset list, not this component —
 * anything that produces an image and files it as `type: "mockup"` appears
 * here with no change to the renderer or to any template. A generated file
 * should carry an `AssetCredit`-style provenance marker so the section can say
 * which mockups are photographs of real work and which are renders; a client
 * reading a guideline is entitled to know the difference.
 */
export function MockupGrid({ assets, opts = {} }: { assets: Asset[]; opts?: SectionOptions }) {
  return (
    <div
      data-layout="two-up"
      data-cols={opts.columns ? "" : undefined}
      style={columnVars(opts.columns)}
      className="grid gap-4 sm:grid-cols-2"
    >
      {assets.map((a) => (
        <figure key={a.id} className="flex flex-col gap-2 m-0">
          <div className="overflow-hidden h-[240px] mk-card" style={gPlate}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={a.url}
              alt={a.fileName}
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          {opts.showNames !== false && (
            <figcaption dir="auto" className="bidi-auto text-[12px]" style={{ color: "var(--g-text-faint)" }}>
              {a.fileName.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]/g, " ")}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

/**
 * The contents of one derived section, without any section chrome.
 *
 * This exists so a template can render its sections from a list instead of a
 * hard-coded sequence of `showSection("logo") && …` branches. That sequence was
 * what pinned the page order into the markup: with the bodies addressable by
 * id, the order becomes data, and a studio can move Colour above Logo or drop
 * its own section between them. Each template still supplies its own wrapper,
 * numbering and heading style, so none of them lose their character.
 *
 * `overrides` is for the places where a template genuinely differs — Atlas
 * lists colour values in its own grid rather than the shared swatch cards —
 * so a template opts out of one body without opting out of the mechanism.
 *
 * **The section's chosen layout is resolved here**, from `ws.sectionStyles`,
 * rather than threaded in as a prop. That is deliberate: `ws` is already in the
 * context, every template builds the context the same way, and every template
 * renders its derived sections through this one function — so a layout choice
 * reaches all six of them, the editing canvas and the published page without any
 * of them being touched. The shared-renderer property is what makes that true,
 * and this is it being spent rather than described.
 *
 * `variant` names a component, not a value: see `lib/sectionVariants.ts`.
 */
export function FixedSectionBody({
  id,
  ctx,
  overrides,
}: {
  id: string;
  ctx: FixedSectionContext;
  overrides?: Record<string, ReactNode>;
}) {
  const { ws, isAr, onDark, attachedSlots, photoAssets, iconAssets, mockupAssets, publishedDepartments } = ctx;
  // Unset, or naming a layout that no longer exists, resolves to the section's
  // default — which is the layout it has always had.
  const stored = ws.sectionStyles[id]?.variant;
  const variant = resolveVariantKey(id, stored);
  /**
   * What the studio has turned on and off inside this section.
   *
   * Resolved once here, from the same record the variant comes from, and handed
   * to whichever arrangement renders — so every layout of a section honours the
   * same options and none of them carries its own idea of a default.
   */
  const opts = resolveOptions(id, ws.sectionOptions?.[id]);

  /*
   * A template's own body is that template's *default* for the section, and an
   * explicit layout choice outranks it.
   *
   * Three templates render a body of their own — Docs and Atlas their own colour
   * grids, Manual its own palette and type pages. Letting those win
   * unconditionally meant choosing a layout did nothing at all in two of the six
   * templates, silently, which is the worst way for a feature to be broken: the
   * picker moved, the page didn't, and nothing said why.
   *
   * Precedence is therefore: an explicitly chosen non-default layout, then the
   * template's own body, then the shared default. Choosing the default back again
   * stores nothing and hands the section to the template, which is the same thing
   * every other unset field in `BlockStyle` does.
   */
  const choosingDefault = variant === resolveVariantKey(id, undefined);
  if (overrides && id in overrides && choosingDefault) return <>{overrides[id]}</>;

  switch (id) {
    case "mockups":
      if (variant === "one-up") return <MockupRows assets={mockupAssets} columns={1} opts={opts} />;
      if (variant === "three-up") return <MockupRows assets={mockupAssets} columns={3} opts={opts} />;
      return <MockupGrid assets={mockupAssets} opts={opts} />;
    case "strategy":
      return <StrategySection ws={ws} isAr={isAr} />;
    case "logo": {
      // The construction drawings need one lockup to demonstrate on; the first
      // attached slot is the one the rest of the site already treats as primary.
      const primary = attachedSlots.length > 0 ? ws.logo[attachedSlots[0]] : undefined;
      // The sign-off panel is not part of the layout choice — it is the client's
      // approval of this section, and every layout of it is the same section.
      const signOff = <SignOffPanel ws={ws} section="logo" isAr={isAr} />;
      if (variant === "lockups") {
        return (
          <>
            <LogoLockups ws={ws} attachedSlots={attachedSlots} onDark={onDark} opts={opts} />
            {signOff}
          </>
        );
      }
      if (variant === "hero") {
        return (
          <>
            <LogoHero ws={ws} attachedSlots={attachedSlots} onDark={onDark} isAr={isAr} opts={opts} />
            {signOff}
          </>
        );
      }
      return (
        <>
          <LogoGrid ws={ws} attachedSlots={attachedSlots} onDark={onDark} opts={opts} />
          {primary && opts.showClearspace !== false && <ClearspaceDiagram slot={primary} onDark={onDark} isAr={isAr} />}
          {primary && opts.showVariations !== false && <LogoVariations ws={ws} slot={primary} isAr={isAr} />}
          {/* The diagram states the clearspace rule now, so the sentence that
              used to carry it alone would be the same number printed twice. It
              stays as the fallback for a workspace with no attached lockup to
              draw the diagram on. */}
          {!primary && <ClearspaceCaption ws={ws} attachedSlots={attachedSlots} isAr={isAr} />}
          {signOff}
        </>
      );
    }
    case "misuse": {
      const primary = attachedSlots.length > 0 ? ws.logo[attachedSlots[0]] : undefined;
      return primary ? <MisuseGrid slot={primary} onDark={onDark} isAr={isAr} /> : null;
    }
    case "app-icon":
      return <AppIconGrid ws={ws} isAr={isAr} />;
    case "patterns":
      return <PatternGrid ws={ws} isAr={isAr} />;
    case "social":
      return <SocialProfiles ws={ws} isAr={isAr} />;
    case "color":
      return (
        <>
          {variant === "bands" ? (
            <ColorBands ws={ws} isAr={isAr} opts={opts} />
          ) : variant === "chips" ? (
            <ColorChips ws={ws} isAr={isAr} opts={opts} />
          ) : variant === "feature" ? (
            <ColorFeature ws={ws} isAr={isAr} opts={opts} />
          ) : (
            <ColorGrid ws={ws} isAr={isAr} opts={opts} />
          )}
          <SignOffPanel ws={ws} section="color" isAr={isAr} />
        </>
      );
    case "typography":
      return (
        <>
          {variant === "scale" ? (
            <TypeScaleTable ws={ws} isAr={isAr} opts={opts} />
          ) : variant === "poster" ? (
            <TypePoster ws={ws} isAr={isAr} opts={opts} />
          ) : (
            <TypeSpecimen ws={ws} isAr={isAr} opts={opts} />
          )}
          <SignOffPanel ws={ws} section="typography" isAr={isAr} />
        </>
      );
    case "photography":
      if (variant === "feature") return <PhotoFeature assets={photoAssets} opts={opts} />;
      if (variant === "strip") return <PhotoStrip assets={photoAssets} opts={opts} />;
      return <PhotoGrid assets={photoAssets} opts={opts} />;
    case "icons":
      if (variant === "named") return <IconNamed assets={iconAssets} onDark={onDark} opts={opts} />;
      if (variant === "dense") return <IconDense assets={iconAssets} onDark={onDark} opts={opts} />;
      return <IconGrid assets={iconAssets} onDark={onDark} opts={opts} />;
    case "personas":
      return <PersonaGrid personas={ws.strategy.personas} />;
    case "voice":
      return <VoiceList traits={ws.strategy.voiceTraits} isAr={isAr} />;
    case "departments":
      return <DepartmentsSection ws={ws} departments={publishedDepartments} isAr={isAr} />;
    default:
      return null;
  }
}

/**
 * What each sign-off panel is signing off.
 *
 * A guideline page carries one of these per section, and every control in all
 * of them was called the same thing — four "Your name" fields, four "Sign off"
 * buttons. The client is the person on this page with the least context in the
 * whole product, and "which one of these four am I in" is not a question to
 * leave them answering by scroll position.
 */
const SIGN_OFF_SECTION: Record<PinSection, [string, string]> = {
  overview: ["Overview", "نظرة عامة"],
  logo: ["Logo", "الشعار"],
  color: ["Colour", "الألوان"],
  typography: ["Typography", "الخطوط"],
};

export function SignOffPanel({ ws, section, isAr }: { ws: Workspace; section: PinSection; isAr: boolean }) {
  const { addSignOffPin } = useApp();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const pins = ws.signOffPins.filter((p) => p.section === section);
  const sectionName = SIGN_OFF_SECTION[section][isAr ? 1 : 0];

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !note.trim()) return;
    addSignOffPin(ws.id, section, name.trim(), note.trim());
    setNote("");
    showToast(isAr ? "تم تسجيل الاعتماد — سيراه الاستوديو أيضًا." : "Sign-off recorded — the studio will see it too.", "success");
  }

  return (
    <div
      className="p-4 flex flex-col gap-3"
      role="group"
      aria-label={isAr ? `اعتماد ${sectionName}` : `Sign off ${sectionName}`}
      style={gCard}
    >
      <div className="flex items-center gap-2">
        <Icon name="map-marker" size={14} style={{ color: "var(--g-accent)" }} />
        <span className="text-[12px] font-semibold" style={{ color: "var(--g-text-muted)" }}>
          {isAr ? `اعتماد ${sectionName}` : `Sign off ${sectionName}`}
        </span>
        {pins.length > 0 && (
          <span className="text-[11px]" style={{ color: "var(--g-text-faint)" }}>
            {isAr ? `${pins.length} ملاحظة` : `${pins.length} note${pins.length === 1 ? "" : "s"}`}
          </span>
        )}
      </div>

      {pins.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {pins.map((p) => (
            <div key={p.id} className="flex items-start gap-2.5 text-[12px]">
              <Icon
                name={p.resolved ? "check-circle" : "map-marker"}
                size={13}
                style={{ color: p.resolved ? "var(--success)" : "var(--warning)", marginTop: 3, flexShrink: 0 }}
              />
              <div className="flex-1 min-w-0">
                <span className="font-medium">{p.authorName}</span>{" "}
                <span style={{ color: "var(--g-text-faint)" }}>· {formatRelative(p.createdAt)}</span>
                <div style={{ color: "var(--g-text-muted)" }}>{p.note}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label={isAr ? `اسمك — اعتماد ${sectionName}` : `Your name — signing off ${sectionName}`}
          placeholder={isAr ? "اسمك" : "Your name"}
          className="h-9 px-3 outline-none text-[12px] w-[150px] shrink-0"
          style={{ ...gInset, color: "var(--g-text)" }}
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-label={isAr ? `ملاحظة اعتماد ${sectionName}` : `Note on ${sectionName}`}
          placeholder={isAr ? "يبدو جيدًا — معتمد" : "Looks good — approved"}
          className="h-9 px-3 outline-none text-[12px] flex-1 min-w-0"
          style={{ ...gInset, color: "var(--g-text)" }}
        />
        <button
          type="submit"
          aria-label={isAr ? `اعتماد ${sectionName}` : `Sign off ${sectionName}`}
          className="h-9 px-4 text-[12px] font-semibold cursor-pointer shrink-0"
          // Not white: white on a pale brand accent is unreadable, and a pale
          // accent is a palette a studio will genuinely hand over.
          style={{ ...gInset, background: "var(--g-accent)", color: "var(--g-accent-ink)" }}
        >
          {isAr ? "اعتماد" : "Sign off"}
        </button>
      </form>
    </div>
  );
}
