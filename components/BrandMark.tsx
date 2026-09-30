"use client";

import { CSSProperties, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { analyseMark, getCachedProfile, type MarkProfile, needsPlate, shouldReverse } from "@/lib/markTone";

const UNMEASURED: MarkProfile = { tone: "unknown", luminance: NaN, transparency: 0 };

/**
 * A brand's own logo or icon artwork, rendered in the colours it was uploaded
 * in.
 *
 * Every place that shows uploaded artwork goes through here, so the rule for
 * when a mark may be reversed lives once instead of as a `filter: invert(1)`
 * repeated at twenty call sites — which is how a blue logo ended up rendering
 * orange across the whole product. See lib/markTone.ts for the rule itself.
 *
 * Until the measurement resolves the artwork is drawn untouched, so the
 * uploaded colours are what appears first and a single-tone mark settles into
 * its reversed form a frame later. Wrong-but-visible beats a flash of an
 * inverted brand colour.
 *
 * All of that is the fallback. When the brand has uploaded its own light
 * version, `lightSrc` is drawn on dark grounds exactly as supplied and no
 * measurement or inversion happens at all — a file the studio chose always
 * beats a rule this code inferred.
 */
export function BrandMark({
  src,
  lightSrc,
  alt,
  onDark,
  style,
  className,
  fallbackIcon = "image",
  fallbackSize = 20,
  plate = false,
}: {
  src: string | undefined;
  /** The brand's own reversed artwork, used verbatim whenever `onDark`. */
  lightSrc?: string;
  alt: string;
  /** Whether the surface behind this mark is dark. */
  onDark: boolean;
  style?: CSSProperties;
  className?: string;
  fallbackIcon?: string;
  fallbackSize?: number;
  /**
   * Allow a plate behind artwork that would otherwise vanish into its ground.
   *
   * Off by default, because inside a brand's own guideline a studio may have
   * placed the mark deliberately and a plate the app added would be a change
   * to their layout. On by default nowhere; turned on by the app's own chrome,
   * where a logo that can't be seen is simply a bug.
   */
  plate?: boolean;
}) {
  const supplied = onDark && lightSrc ? lightSrc : undefined;
  const [profile, setProfile] = useState<MarkProfile>(() => (src ? getCachedProfile(src) ?? UNMEASURED : UNMEASURED));
  // Which src failed, rather than a boolean — so pointing this at a different
  // file clears the failure by itself, with no effect to reset it.
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const broken = !!src && brokenSrc === src;

  useEffect(() => {
    // Nothing to measure when the studio supplied the reversed file itself.
    if (!src || supplied) return;
    let cancelled = false;
    // analyseMark resolves synchronously from its cache on a repeat call, so
    // the common path costs one microtask and no flash.
    void analyseMark(src).then((p) => {
      if (!cancelled) setProfile(p);
    });
    return () => {
      cancelled = true;
    };
  }, [src, supplied]);

  if (!src || broken) {
    return (
      <span className={className} style={{ display: "grid", placeItems: "center", ...style }}>
        <Icon name={fallbackIcon} size={fallbackSize} style={{ color: "var(--text-faint)" }} />
      </span>
    );
  }

  const plated = plate && !supplied && needsPlate(profile, onDark);

  /*
   * The plate.
   *
   * A light ground the mark can sit on, padded so the artwork keeps a margin
   * rather than butting up against the edge. This is what a printed brand book
   * does with a positive logo on a dark page, and it's the answer
   * lib/markTone.ts has always specified for artwork that can't be reversed —
   * a coloured mark stays the colour it was uploaded in.
   *
   * It is drawn as the image's own background and padding, not as a wrapper
   * around it, and that is the whole point. The wrapper version put the
   * caller's `maxHeight: 64` on the wrapper and gave the image `maxHeight:
   * 100%` — and a percentage max-height resolves against the containing
   * block's height, which for a shrink-to-fit box is indefinite. So it
   * computed to `none`, the image rendered at its natural size, and a
   * 1200x900 logo drew at 1200x900: the plate stayed 64px while the artwork
   * burst out of it and across the filename underneath. Measured before the
   * fix at 278x209 inside a 110px well.
   *
   * With one element there is no inner box to overflow, and the caller's own
   * constraint is the only one in play. `content-box` so that constraint keeps
   * meaning "how big the artwork is" — under `border-box` the padding would
   * eat into it and every plated mark would silently shrink by 10px.
   */
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={supplied ?? src}
      alt={alt}
      className={className}
      onError={() => setBrokenSrc(src)}
      style={{
        /*
         * Two defaults, both about an <img> that is given a max size and no
         * size. A flex item stretches on its cross axis, so a lockup capped at
         * `maxHeight` inside a flex *column* had its width pulled out to the
         * container's and rendered horizontally stretched — the sidebar logo on
         * the Docs template. `alignSelf` opts out of that stretch, and
         * `objectFit` keeps the aspect ratio whenever a caller does pin both
         * dimensions. Both are overridable: a caller's own style wins.
         */
        alignSelf: "center",
        objectFit: "contain",
        ...style,
        ...(plated
          ? {
              boxSizing: "content-box" as const,
              padding: 5,
              borderRadius: 6,
              background: onDark ? "#ffffff" : "#0d0d0f",
            }
          : null),
        filter: !supplied && shouldReverse(profile.tone, onDark) ? "invert(1)" : undefined,
      }}
    />
  );
}
