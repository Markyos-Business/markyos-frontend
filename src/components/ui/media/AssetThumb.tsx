"use client";

import { CSSProperties, useEffect, useState } from "react";
import { Icon } from "@/components/ui";
import {
  analyseMark,
  getCachedProfile,
  luminanceOfCss,
  type MarkProfile,
  placeArtwork,
} from "@/lib/markTone";

const UNMEASURED: MarkProfile = { tone: "unknown", luminance: NaN, transparency: 0 };

/**
 * The luminance of a theme token, as the document actually paints it.
 *
 * Read out of the live custom property rather than written down here, so the
 * answer follows the token instead of going stale the next time somebody
 * retunes a surface.
 *
 * It re-reads on `data-theme` rather than on `useTheme().resolved`, and that is
 * not a stylistic preference. This value is a fact about the *document*, and
 * anything that stamps the attribute changes it — the pre-paint script in
 * ThemeProvider, a test harness, a future high-contrast mode. Keying it to
 * React's copy of the theme meant that whenever the attribute moved without a
 * re-render the measurement silently went stale, and a stale ground is worse
 * than no ground: it produces a confident decision about a surface that is no
 * longer there. The surfaces sweep caught exactly that — every thumbnail
 * correctly adapted for the theme the page had loaded in, and none of them for
 * the theme it was actually being displayed in.
 *
 * NaN until the first effect runs, and NaN is the signal the callers want: on
 * the server and on the first paint there is nothing measured, and the honest
 * response to an unmeasured ground is to draw the artwork exactly as uploaded.
 */
const useGroundLuminance = (token: string): number => {
  const [luminance, setLuminance] = useState(NaN);

  useEffect(() => {
    const read = () => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(token);
      const next = luminanceOfCss(value);
      setLuminance((prev) => (Object.is(prev, next) ? prev : next));
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, [token]);

  return luminance;
};

type AssetThumbProps = {
  src: string | undefined;
  alt: string;
  ground?: string;
  style?: CSSProperties;
  className?: string;
  fallbackIcon?: string;
  fallbackSize?: number;
  adapt?: boolean;
};

/**
 * An uploaded file, shown as a thumbnail, on a ground it can actually be seen
 * against.
 *
 * Every grid in this app drew its thumbnails as a bare `<img>` in a well of one
 * fixed surface colour. That is fine for a photograph, which brings its own
 * ground, and wrong for the two things these grids are mostly full of: a logo
 * and an icon, which are usually a single colour on transparency. A white
 * wordmark on the light theme's `--surface-2` is a white shape on a near-white
 * card, and it reads as an empty tile — no error, nothing broken, just a file
 * that appears not to have uploaded.
 *
 * So the file is measured and the ground is chosen from the measurement. Same
 * engine as {@link BrandMark}, and the same rule: a single-tone mark may be
 * reversed, a mark carrying real colour never is, and anything that still can't
 * separate gets a plate behind it rather than a filter over it.
 *
 * `ground` is the token of the surface this thumbnail sits on, read live from
 * the document — so switching theme re-decides every thumbnail, and retuning a
 * surface token re-decides them too.
 */
const AssetThumb = ({
  src,
  alt,
  ground = "--surface-2",
  style,
  className,
  fallbackIcon = "image",
  fallbackSize = 22,
  /**
   * Off for a photograph.
   *
   * A photo fills its own frame and has no transparency to sit on, so plating
   * one would draw a white border inside a white card. The measurement would
   * usually decline anyway — a photograph's mean luminance rarely lands within
   * 1.5:1 of a grey — but a flat, pale, low-key image is exactly the case where
   * it would decide wrongly, and a photo is the one kind of file where "leave
   * it alone" is always right.
   */
  adapt = true,
}: AssetThumbProps) => {
  const groundLuminance = useGroundLuminance(ground);
  const [profile, setProfile] = useState<MarkProfile>(() => (src ? getCachedProfile(src) ?? UNMEASURED : UNMEASURED));
  // Which src failed, rather than a boolean — so pointing this at a different
  // file clears the failure by itself, with no effect to reset it.
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const broken = !!src && brokenSrc === src;

  useEffect(() => {
    if (!src || !adapt) return;
    let cancelled = false;
    // analyseMark resolves synchronously from its cache on a repeat call, so
    // the common path costs one microtask and no flash.
    void analyseMark(src).then((p) => {
      if (!cancelled) setProfile(p);
    });
    return () => {
      cancelled = true;
    };
  }, [src, adapt]);

  if (!src || broken) {
    return (
      <span className={className} style={{ display: "grid", placeItems: "center", ...style }}>
        <Icon name={fallbackIcon} size={fallbackSize} className="text-text-faint" />
      </span>
    );
  }

  const placement =
    adapt && !Number.isNaN(groundLuminance)
      ? placeArtwork(profile, groundLuminance)
      : { reverse: false, plate: null, separation: NaN };

  /*
   * One element, not a wrapper around an image.
   *
   * The plate is drawn as the image's own background and padding for the reason
   * BrandMark documents at length: a wrapper takes the caller's `maxHeight` and
   * leaves the image with a percentage max-height, which resolves against an
   * indefinite height, computes to `none`, and lets a 1200px logo render at
   * 1200px inside a 100px well. `content-box` keeps the caller's constraint
   * meaning "how big the artwork is" rather than shrinking it by the padding.
   */
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      data-adapted={placement.reverse ? "reverse" : placement.plate ? "plate" : undefined}
      onError={() => setBrokenSrc(src)}
      style={{
        objectFit: "contain",
        ...style,
        ...(placement.plate
          ? {
              boxSizing: "content-box" as const,
              padding: 6,
              borderRadius: 8,
              background: placement.plate,
            }
          : null),
        filter: placement.reverse ? "invert(1)" : undefined,
      }}
    />
  );
};

export { AssetThumb, useGroundLuminance };
export type { AssetThumbProps };
