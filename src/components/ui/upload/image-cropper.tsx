"use client";

import { useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { SliderField } from "../field/slider-field";
import { useUiStrings } from "../ui-strings";

/** Zoom (1 = the image just covers the frame) and offset, each -1…1 of how far it can move. */
type CropView = { zoom: number; x: number; y: number };
type Natural = { w: number; h: number };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * The image's scale against a frame 1 unit wide and 1/aspect tall, and how
 * far it can move each way in those units. Shared by the view and the crop,
 * so what you see is what you get.
 */
function geometry(nat: Natural, aspect: number, zoom: number) {
  const cover = Math.max(1 / nat.w, 1 / aspect / nat.h);
  const s = cover * zoom;
  return { s, maxX: (nat.w * s - 1) / 2, maxY: (nat.h * s - 1 / aspect) / 2 };
}

/** The visible part of the image as a new image, `width` px wide, as a data URL. */
async function cropToDataUrl(src: string, view: CropView, aspect: number, width: number, type = "image/jpeg"): Promise<string> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const nat = { w: img.naturalWidth, h: img.naturalHeight };
  const { s, maxX, maxY } = geometry(nat, aspect, view.zoom);
  const vw = 1 / s;
  const vh = 1 / aspect / s;
  // The frame's centre, in image pixels: the image moved by x·maxX frame units.
  const cx = nat.w / 2 - (view.x * maxX) / s;
  const cy = nat.h / 2 - (view.y * maxY) / s;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.round(width / aspect);
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;
  ctx.drawImage(img, cx - vw / 2, cy - vh / 2, vw, vh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL(type, 0.9);
}

type ImageCropperProps = {
  src: string;
  /** Width over height of the result: 16/9, 1. */
  aspect: number;
  /** A circle for a profile photo; the result is still square. */
  shape?: "rect" | "circle";
  view: CropView;
  onViewChange: (view: CropView) => void;
};

/**
 * Choose what part of an image shows: drag it, or focus it and use the arrow
 * keys (Shift for bigger steps), and zoom with the slider. The frame is the
 * result's shape; the image can't be pulled off any edge.
 */
const ImageCropper = ({ src, aspect, shape = "rect", view, onViewChange }: ImageCropperProps) => {
  const { t } = useUiStrings();
  const hintId = `${useId()}-hint`;
  const [nat, setNat] = useState<Natural | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const g = nat ? geometry(nat, aspect, view.zoom) : null;

  const move = (dx: number, dy: number) => onViewChange({ ...view, x: clamp(view.x + dx, -1, 1), y: clamp(view.y + dy, -1, 1) });

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: view.x, y: view.y };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !g || !frame.current) return;
    const unit = frame.current.clientWidth;
    // A pixel dragged is 1/unit frame units, and maxX frame units is the full range.
    onViewChange({
      ...view,
      x: g.maxX > 0 ? clamp(drag.current.x + (e.clientX - drag.current.px) / unit / g.maxX, -1, 1) : 0,
      y: g.maxY > 0 ? clamp(drag.current.y + (e.clientY - drag.current.py) / unit / g.maxY, -1, 1) : 0,
    });
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.25 : 0.05;
    // The image moves the way the arrow points, whatever the language.
    const by: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (!by[e.key]) return;
    e.preventDefault();
    move(...by[e.key]);
  };

  return (
    <div className="flex flex-col gap-space-6">
      <div
        ref={frame}
        role="group"
        tabIndex={0}
        aria-label={t.imagePosition}
        aria-describedby={hintId}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={onKeyDown}
        className={`relative w-full cursor-grab touch-none select-none overflow-hidden bg-surface-sunken shadow-edge focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:cursor-grabbing ${shape === "circle" ? "rounded-full" : "rounded-lg"}`}
        style={{ aspectRatio: String(aspect) }}
        dir="ltr"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL being cropped, not a page image */}
        <img
          src={src}
          alt=""
          draggable={false}
          onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          className="pointer-events-none absolute max-w-none"
          style={
            g && nat
              ? {
                  width: `${nat.w * g.s * 100}%`,
                  left: `calc(50% + ${view.x * g.maxX * 100}%)`,
                  top: `calc(50% + ${view.y * g.maxY * aspect * 100}%)`,
                  transform: "translate(-50%, -50%)",
                }
              : { opacity: 0 }
          }
        />
      </div>
      <p id={hintId} className="-mt-space-3 text-caption text-text-muted">
        {t.imagePositionHint}
      </p>
      <SliderField label={t.zoom} value={view.zoom} min={1} max={3} step={0.05} onChange={(zoom) => onViewChange({ ...view, zoom })} valueText={`${Math.round(view.zoom * 100)}%`} />
    </div>
  );
};

export { ImageCropper, cropToDataUrl };
export type { CropView, ImageCropperProps };
