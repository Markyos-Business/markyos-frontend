/**
 * Whether Markyos is in beta. One switch: every logo carries the tag while
 * this is true, and turning it off removes it everywhere at once.
 */
const MARKYOS_BETA = true;

type MarkyosLogoProps = {
  /** `mark` is the symbol, `wordmark` the name, `lockup` both. */
  variant: "mark" | "wordmark" | "lockup";
  /** The image's size, e.g. `h-[22px]` or `w-[190px]`. */
  className?: string;
  /** The tag's language. */
  isAr?: boolean;
  /** Leave the beta tag off, e.g. where the logo is too small to carry it (a collapsed rail). */
  hideBeta?: boolean;
};

// Keep the artwork in public/brand, matching the landing frontend. Arabic
// uses its own designer-supplied lockup; logos are never mirrored.
const SRC = {
  mark: "/brand/markyos-mark.svg",
  wordmark: "/brand/markyos-wordmark.svg",
  lockup: "/brand/markyos-lockup-en.svg",
} as const;

/**
 * The Markyos logo, wherever the product shows it, with the beta tag beside
 * it. The art is drawn dark; the theme token inverts it on dark grounds.
 */
const MarkyosLogo = ({ variant, className = "", isAr = false, hideBeta = false }: MarkyosLogoProps) => (
  <span className="inline-flex shrink-0 items-center gap-space-3">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={variant === "lockup" && isAr ? "/brand/markyos-lockup-ar.svg" : SRC[variant]} alt={isAr ? "ماركيوس" : "Markyos"} className={`shrink-0 [filter:var(--chrome-mark-invert)] ${className}`} />
    {MARKYOS_BETA && !hideBeta && <BetaTag isAr={isAr} />}
  </span>
);

/** "Beta" as a small accent tag: says the product is still taking shape. */
const BetaTag = ({ isAr = false }: { isAr?: boolean }) => (
  <span className="inline-flex h-4.5 items-center rounded-sm bg-accent-soft px-1.5 text-[10.5px] leading-none font-medium text-accent-on-soft">
    {isAr ? "تجريبي" : "Beta"}
  </span>
);

export { BetaTag, MARKYOS_BETA, MarkyosLogo };
export type { MarkyosLogoProps };
