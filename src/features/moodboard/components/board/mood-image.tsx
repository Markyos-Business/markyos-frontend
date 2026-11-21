"use client";

import { useState, type CSSProperties } from "react";

/** Raster files on the media host get WebP thumbnails at these widths (backend `thumbnails.py`). */
const THUMB_WIDTHS = [480, 960] as const;

/** `srcset` for a stored raster image, or undefined for anything that has no thumbnails. */
export function thumbSrcSet(url: string): string | undefined {
  if (!/^https?:\/\//.test(url) || !/\.(jpe?g|png|webp)$/i.test(url)) return undefined;
  return [...THUMB_WIDTHS.map((w) => `${url}.w${w}.webp ${w}w`), `${url} 1600w`].join(", ");
}

/**
 * A moodboard image at the size it is drawn, not the size it is stored.
 *
 * Cards are a few hundred pixels wide; the stored image is 1600. With the
 * thumbnails in a `srcset`, the browser fetches and decodes the smallest one
 * that is sharp at this screen's density. `width` is the card's width in board
 * units; the column view, which has none, assumes a 320px column. If a
 * thumbnail is missing (an upload from before they existed), the image falls
 * back to the original once rather than showing a broken picture.
 */
export function MoodImage({ url, alt, width, style, className }: { url: string; alt: string; width?: number; style?: CSSProperties; className?: string }) {
  const [plain, setPlain] = useState(false);
  const srcSet = plain ? undefined : thumbSrcSet(url);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      srcSet={srcSet}
      sizes={srcSet ? `${Math.round(width ?? 320)}px` : undefined}
      alt={alt}
      loading="lazy"
      decoding="async"
      // Load-bearing: a native image drag takes the pointer and cancels the card's own gesture.
      draggable={false}
      onError={srcSet ? () => setPlain(true) : undefined}
      className={className}
      style={style}
    />
  );
}
