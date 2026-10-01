import { bestInkOn, contrastRatio } from "@/lib/contrast";
import type { SectionOptions } from "@/lib/sectionOptions";

/**
 * The pieces more than one section layout needs.
 *
 * Extracted from `Content.tsx` when the alternate layouts arrived, for one
 * reason: `Content.tsx` dispatches to `SectionLayouts.tsx`, so anything the
 * layouts imported back out of `Content.tsx` would be an import cycle. A type
 * scale and a swatch edge belong to neither file in particular, so they live in
 * their own.
 *
 * No JSX here, so this stays importable from anywhere.
 */

/**
 * A hard edge for a swatch that nearly matches what it is drawn on.
 *
 * "Surface 1" printed on a Surface-1 card simply isn't there, and it is a swatch
 * every palette in this product has. One that already separates gets a light
 * edge, because a heavy rule around a strong colour reads as a mistake.
 */
export function swatchEdge(hex: string, plate: string): string {
  const ink = bestInkOn(hex)?.ink ?? "#000000";
  const rgb = ink === "#ffffff" ? "255,255,255" : "0,0,0";
  const against = contrastRatio(hex, plate);
  const flush = against !== null && against < 1.6;
  return `inset 0 0 0 ${flush ? 1.5 : 1}px rgba(${rgb},${flush ? 0.5 : 0.22})`;
}

/**
 * The brand's own size steps.
 *
 * `words` trims the sample to what fits on one line at that size. A specimen
 * that ends in an ellipsis reads as a layout that broke; one set to the measure
 * reads as a decision, which is what a guideline is made of.
 */
export const TYPE_SCALE: { key: string; label: string; arLabel: string; size: number; lead: number; words: number }[] = [
  { key: "display", label: "Display", arLabel: "عنوان رئيسي", size: 44, lead: 1.1, words: 3 },
  { key: "heading", label: "Heading", arLabel: "عنوان", size: 26, lead: 1.25, words: 6 },
  { key: "body", label: "Body", arLabel: "نص", size: 16, lead: 1.7, words: 9 },
  { key: "caption", label: "Caption", arLabel: "تعليق", size: 12, lead: 1.5, words: 12 },
];

export const LATIN_SAMPLE = "The quick brown fox jumps over the lazy dog";
/** A standard Arabic pangram — every letter of the alphabet, in a real sentence. */
export const ARABIC_SAMPLE = "نص حكيم له سر قاطع وذو شأن عظيم مكتوب على ثوب أخضر ومغلف بجلد أزرق";

/**
 * The two scripts a Markyos brand sets type in, described once.
 *
 * A bilingual brand's Arabic is not a footnote to its Latin, so every typography
 * layout has to show both — and each one deciding for itself what "both" means
 * is how the specimen and the size table end up disagreeing about which pangram
 * the brand uses.
 */
export interface ScriptSpec {
  script: "latin" | "arabic";
  dir: "ltr" | "rtl";
  label: string;
  arLabel: string;
  /** The CSS custom property carrying the family, set by `BrandFonts`. */
  fontFamily: string;
  showing: string;
  characters: string;
  sample: string;
}

export const SCRIPTS: ScriptSpec[] = [
  {
    script: "latin",
    dir: "ltr",
    label: "Latin",
    arLabel: "لاتيني",
    fontFamily: "var(--font-sans)",
    showing: "Aa Bb Cc",
    characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789",
    sample: LATIN_SAMPLE,
  },
  {
    script: "arabic",
    dir: "rtl",
    label: "Arabic",
    arLabel: "عربي",
    fontFamily: "var(--font-arabic)",
    showing: "أ ب ج",
    characters: "ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي ٠١٢٣٤٥٦٧٨٩",
    sample: ARABIC_SAMPLE,
  },
];

/**
 * The sentence a specimen is set in, for one script.
 *
 * A studio's own line when they wrote one, the built-in pangram when they didn't.
 * Here rather than in each layout because "which sample" is one decision and
 * three layouts were about to answer it three ways.
 */
export function sampleFor(script: "latin" | "arabic", fallback: string, opts: SectionOptions): string {
  const given = script === "arabic" ? opts.sampleTextAr : opts.sampleText;
  return given?.trim() || fallback;
}

/** Trims a sample to the words that fit on one line at a given step. */
export function sampleAt(sample: string, words: number): string {
  return sample.split(" ").slice(0, words).join(" ");
}

/**
 * How tall a photograph's tile stands, for a chosen framing.
 *
 * `original` is the one that is not a height at all: it lets the image set its
 * own, which is the only framing that never crops. The others are fixed heights
 * with `object-fit: cover`, because a grid of mixed aspect ratios is exactly what
 * a photography section exists to avoid looking like.
 */
export function photoTile(aspect: SectionOptions["aspect"]): { height?: number; fit: "cover" | "contain" } {
  switch (aspect) {
    case "square":
      return { height: 200, fit: "cover" };
    case "wide":
      return { height: 120, fit: "cover" };
    case "original":
      return { fit: "contain" };
    default:
      return { height: 140, fit: "cover" };
  }
}

/** A file name as a human would say it — no extension, no separators. */
export function readableFileName(fileName: string): string {
  return fileName.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]/g, " ");
}
