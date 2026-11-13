"use client";

import { useState, useSyncExternalStore } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { CopyButton } from "../button/copy-button";
import { IconButton } from "../button/icon-button";
import { TabPanel, Tabs, useTabIds } from "../tabs";
import { useUiStrings } from "../ui-strings";
import { InputField } from "../field/input-field";
import { hexToRgb } from "@/lib/utils";
import { CHANNEL_MAX, channels, formatColor, fromChannels, hsvToRgb, normalizeHex, rgbToHex, rgbToHsv, type ColorNotation, type Hsv } from "@/lib/color";

type Swatch = { hex: string; name: string };

type ColorPickerProps = {
  /** The colour as a hex, `#0099FF`. */
  value: string;
  /** Called with an upper-case `#RRGGBB` on every change, while dragging too. */
  onChange: (hex: string) => void;
  /** Colours to pick in one press, e.g. the brand palette. */
  swatches?: Swatch[];
  /** The person's last colours, newest first (useRecentColours). */
  recent?: string[];
  /** The notation the fields open in. Default HEX. */
  defaultNotation?: ColorNotation;
  className?: string;
};

type Channel = Exclude<ColorNotation, "hex">;

const NOTATIONS: { key: ColorNotation; label: string }[] = [
  { key: "hex", label: "HEX" },
  { key: "rgb", label: "RGB" },
  { key: "hsl", label: "HSL" },
  { key: "cmyk", label: "CMYK" },
];

// The hue track is colour content, not chrome: the full wheel, red to red.
const HUE_TRACK = `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 360].map((h) => `hsl(${h} 100% 50%)`).join(", ")})`;
// A thumb has to read on any colour, so it is ringed in white with a dark halo.
const THUMB = "pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full";
const THUMB_RING = { boxShadow: "0 0 0 2px white, 0 0 0 3px rgb(0 0 0 / .35)" };

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** The browser's screen eyedropper (Chromium), where there is one. */
type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };
const eyeDropper = (): EyeDropperCtor | undefined => (globalThis as { EyeDropper?: EyeDropperCtor }).EyeDropper;
const noSubscribe = () => () => {};

/** HSV for a hex, keeping the hue it had when the colour has none (grey, black). */
const toHsv = (hex: string, keepHue: number): Hsv => {
  const hsv = rgbToHsv(hexToRgb(hex) ?? { r: 0, g: 0, b: 0 });
  return hsv.s === 0 || hsv.v === 0 ? { ...hsv, h: keepHue } : hsv;
};

/**
 * Drag on an element and get where the pointer is inside it, 0–1 on each
 * axis. Pointer capture keeps the drag going outside the element.
 */
const dragHandlers = (onMove: (x: number, y: number) => void) => {
  const move = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onMove(clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1));
  };
  return {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.focus();
      move(e);
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e);
    },
  };
};

/**
 * The colour picker: one for every colour in the product.
 *
 * A square for saturation (across) and brightness (up) under a hue track, so
 * a colour can be found by eye; fields in HEX, RGB, HSL or CMYK, so an exact
 * one can be typed; the screen eyedropper where the browser has it; and the
 * brand's own swatches when given. CMYK says it is approximate, since there is
 * no print profile behind it.
 *
 * The square and track are keyboard sliders too (arrows, Shift for bigger
 * steps). Colour space has no reading direction, so they stay left-to-right in
 * Arabic, as every colour tool does.
 */
const ColorPicker = ({ value, onChange, swatches, recent, defaultNotation = "hex", className = "" }: ColorPickerProps) => {
  const tabIds = useTabIds();
  const { t } = useUiStrings();
  const hex = normalizeHex(value) ?? "#000000";
  const [notation, setNotation] = useState<ColorNotation>(defaultNotation);
  // What the square and track show. Kept apart from `value` because a hex
  // forgets the hue of a grey; recomputed when the value changes from outside.
  const [hsv, setHsv] = useState<Hsv>(() => toHsv(hex, 0));
  const [seen, setSeen] = useState(hex);
  if (hex !== seen) {
    setSeen(hex);
    // Our own change comes back as the value the square already shows; only
    // a change from outside moves the thumbs.
    if (rgbToHex(hsvToRgb(hsv)) !== hex) setHsv(toHsv(hex, hsv.h));
  }
  // What is being typed, until it parses: a half-typed field never jumps.
  const [draft, setDraft] = useState<string[] | null>(null);
  const [hexError, setHexError] = useState(false);
  const canDrop = useSyncExternalStore(noSubscribe, () => Boolean(eyeDropper()), () => false);

  const emit = (next: string) => {
    if (next !== hex) onChange(next);
  };
  const setFromHsv = (next: Hsv) => {
    setHsv(next);
    setDraft(null);
    emit(rgbToHex(hsvToRgb(next)));
  };
  const setFromHex = (next: string) => {
    setHsv(toHsv(next, hsv.h));
    emit(next);
  };

  const area = dragHandlers((x, y) => setFromHsv({ ...hsv, s: x * 100, v: (1 - y) * 100 }));
  const hueTrack = dragHandlers((x) => setFromHsv({ ...hsv, h: x * 360 }));

  // Arrow keys move the thumb; handled keys stop here, so a board or list
  // behind the picker does not move its own selection too.
  const onAreaKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;
    const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const m = d[e.key];
    if (!m) return;
    e.preventDefault();
    e.stopPropagation();
    setFromHsv({ ...hsv, s: clamp(hsv.s + m[0], 0, 100), v: clamp(hsv.v + m[1], 0, 100) });
  };
  const onHueKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 15 : 1;
    const d: Record<string, number> = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step, Home: -360, End: 360 };
    if (!(e.key in d)) return;
    e.preventDefault();
    e.stopPropagation();
    setFromHsv({ ...hsv, h: clamp(hsv.h + d[e.key], 0, 360) });
  };

  const pickFromScreen = async () => {
    const Ctor = eyeDropper();
    if (!Ctor) return;
    try {
      const picked = normalizeHex((await new Ctor().open()).sRGBHex);
      if (picked) setFromHex(picked);
    } catch {
      // Escape cancels the eyedropper; nothing to do.
    }
  };

  const hueColor = rgbToHex(hsvToRgb({ h: hsv.h, s: 100, v: 100 }));
  const shown = notation === "hex" ? null : (draft ?? channels(hex, notation).map(String));

  return (
    <div className={`flex w-full flex-col gap-space-5 ${className}`}>
      <div
        dir="ltr"
        role="slider"
        tabIndex={0}
        aria-label={t.colorArea}
        aria-valuetext={`${Math.round(hsv.s)}%, ${Math.round(hsv.v)}%`}
        aria-valuenow={Math.round(hsv.s)}
        onKeyDown={onAreaKey}
        {...area}
        className="relative h-40 w-full cursor-crosshair touch-none rounded-lg shadow-edge outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        style={{ background: `linear-gradient(to top, black, transparent), linear-gradient(to right, white, transparent), ${hueColor}` }}
      >
        <span className={THUMB} style={{ ...THUMB_RING, left: `${hsv.s}%`, top: `${100 - hsv.v}%`, background: hex }} />
      </div>

      <div className="flex items-center gap-space-4">
        <span aria-hidden className="size-8 shrink-0 rounded-lg shadow-edge" style={{ background: hex }} />
        <div
          dir="ltr"
          role="slider"
          tabIndex={0}
          aria-label={t.hue}
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={Math.round(hsv.h)}
          onKeyDown={onHueKey}
          {...hueTrack}
          className="relative h-3 flex-1 cursor-pointer touch-none rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          style={{ background: HUE_TRACK }}
        >
          <span className={`${THUMB} top-1/2`} style={{ ...THUMB_RING, left: `${(hsv.h / 360) * 100}%`, background: hueColor }} />
        </div>
        {canDrop && <IconButton icon="eye-dropper" label={t.eyedropper} variant="soft" onClick={pickFromScreen} />}
      </div>

      <div className="flex items-center justify-between gap-space-3">
        <Tabs {...tabIds}
          variant="pill"
          label={t.colorFormat}
          tabs={NOTATIONS}
          active={notation}
          onChange={(k) => {
            setNotation(k);
            setDraft(null);
            setHexError(false);
          }}
        />
        <CopyButton
          text={formatColor(hex, notation)}
          label={t.copy}
          copiedLabel={t.copied}
          copiedMessage={t.valueCopied(formatColor(hex, notation))}
          failedMessage={t.copyFailed}
          variant="ghost"
          size="xs"
        />
      </div>

      <TabPanel id={tabIds.panelId} tabsId={tabIds.id} active={notation} className="flex flex-col gap-space-4">
      {notation === "hex" ? (
        <InputField
          size="sm"
          dir="ltr"
          aria-label="HEX"
          spellCheck={false}
          autoComplete="off"
          value={draft?.[0] ?? hex}
          error={hexError ? t.invalidHex : undefined}
          onChange={(e) => {
            const text = e.target.value;
            setDraft([text]);
            const next = normalizeHex(text);
            setHexError(false);
            if (next && text.replace("#", "").length === 6) setFromHex(next);
          }}
          onBlur={() => {
            const next = draft && normalizeHex(draft[0]);
            if (next) setFromHex(next);
            setHexError(Boolean(draft) && !next);
            if (next || !draft) setDraft(null);
          }}
        />
      ) : (
        <div dir="ltr" className="flex gap-space-3">
          {shown!.map((v, i) => {
            const label = t.channels[notation as Channel][i];
            return (
              <InputField
                key={`${notation}-${i}`}
                size="sm"
                // The letters (R G B, C M Y K) are what every colour tool
                // shows in any language; the full name is for screen readers.
                label={notation.toUpperCase()[i]}
                aria-label={label}
                title={label}
                inputMode="numeric"
                autoComplete="off"
                value={v}
                className="min-w-0 flex-1"
                onChange={(e) => {
                  const next = [...shown!];
                  next[i] = e.target.value.replace(/[^\d]/g, "").slice(0, 3);
                  setDraft(next);
                  if (next.every((n) => n !== "")) {
                    const max = CHANNEL_MAX[notation as Channel];
                    setFromHex(fromChannels(notation as Channel, next.map((n, j) => Math.min(Number(n), max[j]))));
                  }
                }}
                onBlur={() => setDraft(null)}
              />
            );
          })}
        </div>
      )}
      {notation === "cmyk" && <p className="text-caption text-text-faint">{t.cmykNote}</p>}
      </TabPanel>

      {swatches && swatches.length > 0 && (
        <div className="flex flex-col gap-space-2">
          <span className="text-caption text-text-muted">{t.brandColours}</span>
          <div className="flex flex-wrap gap-space-3">
            {swatches.map((s) => {
              const on = normalizeHex(s.hex) === hex;
              return (
                <button
                  key={`${s.name}-${s.hex}`}
                  type="button"
                  title={`${s.name} ${s.hex.toUpperCase()}`}
                  aria-label={s.name}
                  aria-pressed={on}
                  onClick={() => {
                    const next = normalizeHex(s.hex);
                    if (next) setFromHex(next);
                  }}
                  className={`size-7 cursor-pointer rounded-full transition-shadow duration-fast ${on ? "ring-2 ring-accent ring-offset-2 ring-offset-surface-1" : "shadow-edge"}`}
                  style={{ background: s.hex }}
                />
              );
            })}
          </div>
        </div>
      )}
      {recent && recent.length > 0 && (
        <div className="flex flex-col gap-space-2">
          <span className="text-caption text-text-muted">{t.recentColours}</span>
          <div className="flex flex-wrap gap-space-3">
            {recent.map((r) => (
              <button
                key={r}
                type="button"
                title={r}
                aria-label={r}
                aria-pressed={normalizeHex(r) === hex}
                onClick={() => {
                  const next = normalizeHex(r);
                  if (next) setFromHex(next);
                }}
                className={`size-7 cursor-pointer rounded-full transition-shadow duration-fast ${normalizeHex(r) === hex ? "ring-2 ring-accent ring-offset-2 ring-offset-surface-1" : "shadow-edge"}`}
                style={{ background: r }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { ColorPicker };
export type { ColorPickerProps, Swatch as ColorSwatch };
