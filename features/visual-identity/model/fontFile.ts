/**
 * What can be told about an uploaded font file from its name.
 *
 * Reading the real family and weight means parsing the font's `name` table,
 * which is straightforward for TTF/OTF and impossible for WOFF2 without
 * shipping a Brotli decompressor — so a foundry file and a webfont of the same
 * family would be read two different ways, which is worse than reading neither.
 *
 * Instead this uses the naming convention every foundry and Google Fonts
 * already follow — `Family-Weight.ext` — and treats the result as a *starting
 * point the studio can correct*: the family name is editable on the Typography
 * page, and it is shown in the picker so a wrong guess is visible rather than
 * silent. Without this, two files of one family listed as two unrelated
 * entries and `font-weight: 600` rendered as a browser-synthesised fake bold.
 */

const WEIGHT_WORDS: [RegExp, number][] = [
  [/extra[-_ ]?light|ultra[-_ ]?light/i, 200],
  [/semi[-_ ]?bold|demi[-_ ]?bold/i, 600],
  [/extra[-_ ]?bold|ultra[-_ ]?bold/i, 800],
  [/thin|hairline/i, 100],
  [/light/i, 300],
  [/regular|normal|book/i, 400],
  [/medium/i, 500],
  [/black|heavy/i, 900],
  [/bold/i, 700],
];

export interface FontFileMeta {
  family: string;
  weight: number;
  style: "normal" | "italic";
}

/** Strips the extension and any variable-font axis suffix. */
function stem(fileName: string): string {
  return fileName.replace(/\.[a-z0-9]+$/i, "").replace(/\[[^\]]*\]$/, "");
}

/**
 * Splits "BricolageGrotesque-SemiBoldItalic.ttf" into family, weight and style.
 *
 * The weight and style words are removed from the family, so every weight of
 * one family produces the same family string and they group into one entry.
 */
export function fontMetaFromFileName(fileName: string): FontFileMeta {
  const base = stem(fileName);
  // The part after the last separator is where the style suffix lives by
  // convention; when there isn't one the whole name is the family.
  const parts = base.split(/[-_]/);
  const suffix = parts.length > 1 ? parts[parts.length - 1] : "";

  const italic = /italic|oblique/i.test(suffix) || (parts.length === 1 && /italic|oblique/i.test(base));
  const weightSource = suffix || base;
  const weight = WEIGHT_WORDS.find(([re]) => re.test(weightSource))?.[1] ?? 400;

  // A numeric suffix ("Cairo-700") is the weight said outright.
  const numeric = /^([1-9]00)$/.exec(suffix.trim());

  const suffixIsStyle = !!numeric || italic || WEIGHT_WORDS.some(([re]) => re.test(suffix));
  const familyParts = suffixIsStyle && parts.length > 1 ? parts.slice(0, -1) : parts;

  return {
    // "BricolageGrotesque" reads as a name a person wrote, not a filename.
    family: familyParts.join(" ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim() || base,
    weight: numeric ? Number(numeric[1]) : weight,
    style: italic ? "italic" : "normal",
  };
}

/** Whether this file is one a browser can actually declare as a webfont. */
export function isFontFile(file: { name: string; type: string }): boolean {
  return file.type.startsWith("font/") || /\.(woff2?|ttf|otf)$/i.test(file.name);
}

export const FONT_ACCEPT = ".woff2,.woff,.ttf,.otf,font/*";
