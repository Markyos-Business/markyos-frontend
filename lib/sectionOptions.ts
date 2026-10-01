/**
 * What each part of a section shows — the controls, not the presets.
 *
 * `lib/sectionVariants.ts` gives a section a choice of arrangements. This gives
 * it a choice about its *parts*: which value formats a palette prints, whether a
 * type specimen shows its character set, which scripts it sets, the sentence it
 * is set in, whether the logo section carries its construction drawings. It is
 * the difference between picking a template and editing one.
 *
 * The shape is taken from the Guidelines teardown's content nodes, where a
 * palette carries `showName`, `showHex`, `showRgb`, `showCmyk`, `enableCopy` and
 * a grid direction rather than a layout name. The lesson worth taking is that the
 * options are **flat and shared** rather than a bespoke bag per section:
 * `columns` means the same thing on a palette, an icon set and a photo grid, so
 * it is one field, one control and one renderer path. Six private vocabularies
 * for the same six ideas is how an editor becomes impossible to learn.
 *
 * **Every field is optional and unset means "whatever the layout does."** That is
 * the same contract as `BlockStyle`, and it is what lets a studio change one
 * thing without silently opting out of every future improvement to the rest.
 *
 * No React here: the registry is read by the renderers and by the inspector, so
 * the two cannot offer different sets.
 */

export type ColorFormatKey = "HEX" | "RGB" | "HSL" | "CMYK";

export const COLOR_FORMATS: ColorFormatKey[] = ["HEX", "RGB", "HSL", "CMYK"];

export interface SectionOptions {
  /** Which value formats a colour section prints. Empty array means none. */
  formats?: ColorFormatKey[];
  /** Names beside swatches, captions under mockups. */
  showNames?: boolean;
  /** Click-to-copy on values. */
  enableCopy?: boolean;
  /**
   * Tiles per row at the widest container.
   *
   * Narrower containers step down on their own — see `columnVars`. Unset leaves
   * the layout's own responsive choice alone, which is why this is not simply
   * defaulted to a number.
   */
  columns?: number;
  /** Which scripts a typography section sets. */
  scripts?: "both" | "latin" | "arabic";
  showCharacterSet?: boolean;
  /** The brand's size steps, with their line heights. */
  showScale?: boolean;
  /** The sentence a specimen is set in. Blank falls back to the built-in pangram. */
  sampleText?: string;
  sampleTextAr?: string;
  /** The clearspace drawing in the logo section. */
  showClearspace?: boolean;
  /** The colour-variation strip in the logo section. */
  showVariations?: boolean;
  /** How a photograph is framed in its tile. */
  aspect?: "square" | "landscape" | "wide" | "original";
}

export type OptionKey = keyof SectionOptions;

/**
 * Which options each section offers, in the order the inspector shows them.
 *
 * A section absent from this map offers none, and the inspector renders nothing
 * — the same rule `SECTION_VARIANTS` follows, for the same reason: a section
 * nobody has written controls for should not grow an empty panel.
 */
export const SECTION_OPTIONS: Record<string, OptionKey[]> = {
  color: ["formats", "showNames", "enableCopy", "columns"],
  typography: ["scripts", "showCharacterSet", "showScale", "sampleText", "sampleTextAr"],
  logo: ["showClearspace", "showVariations", "columns"],
  photography: ["columns", "aspect"],
  icons: ["columns"],
  mockups: ["columns", "showNames"],
};

/**
 * The values in force, with the defaults that reproduce today's rendering.
 *
 * Stated as explicit defaults rather than left to each renderer's `??`, because
 * a default that lives in four components is four defaults that will eventually
 * disagree. `columns` and `aspect` are deliberately absent: unset means the
 * layout keeps its own responsive grid, which no single number can stand in for.
 */
export function resolveOptions(sectionId: string, stored: SectionOptions | undefined): SectionOptions {
  const offered = SECTION_OPTIONS[sectionId] ?? [];
  const base: SectionOptions = {
    formats: COLOR_FORMATS,
    showNames: sectionId === "color" || sectionId === "mockups",
    enableCopy: true,
    scripts: "both",
    showCharacterSet: true,
    showScale: true,
    sampleText: "",
    sampleTextAr: "",
    showClearspace: true,
    showVariations: true,
  };
  const out: SectionOptions = {};
  for (const key of offered) {
    const given = stored?.[key];
    // `undefined` falls back; an empty array or an empty string does not — "no
    // formats at all" and "the default sentence" are both real choices.
    (out as Record<string, unknown>)[key] = given === undefined ? base[key] : given;
  }
  return out;
}

/**
 * Which scripts a typography layout sets, as a list.
 *
 * A list rather than the stored string, because every typography layout iterates
 * — and a brand that sets only Arabic is a real brand, not a degenerate case of
 * one that sets both.
 */
export function scriptsFor(opts: SectionOptions): Array<"latin" | "arabic"> {
  if (opts.scripts === "latin") return ["latin"];
  if (opts.scripts === "arabic") return ["arabic"];
  return ["latin", "arabic"];
}

/** Whether this section has any options worth showing a panel for. */
export function hasOptions(sectionId: string): boolean {
  return (SECTION_OPTIONS[sectionId] ?? []).length > 0;
}

/** How many columns a label is offered, per section. Small sets, real choices. */
export const COLUMN_CHOICES: Record<string, number[]> = {
  color: [2, 3, 4, 5, 6],
  logo: [1, 2, 3, 4],
  photography: [2, 3, 4],
  icons: [4, 6, 8, 10],
  mockups: [1, 2, 3],
};

/**
 * The three column counts a grid needs, as custom properties.
 *
 * One number from the studio, three in the output: a six-across icon set has to
 * become something narrower on a phone or each tile is 50px wide. Halving, with a
 * floor of two — except where the studio asked for one, which stays one, because
 * "one per row" is a composition and not a density.
 *
 * Read by the `[data-cols]` rules in `app/globals.css`, which are container
 * queries on the page — so they fire inside the editor's narrow frame too.
 */
export function columnVars(columns: number | undefined): Record<string, string> | undefined {
  if (!columns || columns < 1) return undefined;
  const tablet = columns === 1 ? 1 : Math.max(2, Math.ceil(columns / 2));
  const phone = columns === 1 ? 1 : 2;
  return {
    "--cols": String(columns),
    "--cols-tablet": String(tablet),
    "--cols-phone": String(phone),
  };
}
