import type { ColorSwatch, Lang, Workspace } from "@/types";

/**
 * Colour names in the guide's language.
 *
 * A studio names a swatch once, in whichever language it works in. The guide
 * is read in both, so the other language is machine-translated and stored on
 * the swatch (`nameTranslation`) with the name it came from. Reading never
 * calls the translator: the public site only shows what was stored.
 */

const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿ]/;

/** The language a name is written in, by its letters. */
export function nameLang(text: string): Lang {
  return ARABIC.test(text) ? "ar" : "en";
}

/** The name to show in `lang`: as written, or its current translation. */
export function swatchName(swatch: ColorSwatch, lang: Lang): string {
  const name = swatch.name;
  if (!name.trim() || nameLang(name) === lang) return name;
  const t = swatch.nameTranslation;
  return t && t.lang === lang && t.source === name && t.text.trim() ? t.text : name;
}

/** Whether the swatch has a name without a current translation. */
export function needsNameTranslation(swatch: ColorSwatch): boolean {
  const name = swatch.name.trim();
  return !!name && swatch.nameTranslation?.source !== swatch.name;
}

/** The brand with every colour named in `lang`, for rendering a guide. */
export function withSwatchNamesIn(ws: Workspace, lang: Lang): Workspace {
  let changed = false;
  const colors = ws.colors.map((c) => {
    const name = swatchName(c, lang);
    if (name === c.name) return c;
    changed = true;
    return { ...c, name };
  });
  return changed ? { ...ws, colors } : ws;
}
