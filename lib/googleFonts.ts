/**
 * Imports a family from Google Fonts by fetching the real font files and
 * embedding them, rather than linking out to Google's CDN.
 *
 * Embedding is the right call for a brand guideline specifically. The
 * published site has to render the brand's type for a client who may be on a
 * corporate network that blocks third-party CDNs, and a guideline that
 * silently falls back to Helvetica is worse than useless — it misrepresents
 * the brand. Embedding also makes an imported family behave exactly like an
 * uploaded one everywhere else in the app: same asset, same picker, same
 * `@font-face`, same offline behaviour.
 *
 * Nothing here is faked. The stylesheet and the font binaries come from
 * Google's own endpoints; if a family doesn't exist, the import fails and says
 * so rather than inventing a placeholder.
 */

/** One `@font-face` block parsed out of Google's stylesheet. */
interface ParsedFace {
  subset: string;
  weight: number;
  style: "normal" | "italic";
  url: string;
}

export interface ImportedFontFile {
  family: string;
  weight: number;
  style: "normal" | "italic";
  fileName: string;
  /** The font binary, inlined. */
  dataUrl: string;
  sizeKB: number;
}

/** The weights fetched for a family: a text face and something to set bold in. */
const WEIGHTS = [400, 700];

/**
 * Families offered as a starting point.
 *
 * A browsable catalogue would need Google's Developer API and a key, which
 * this build has no honest way to hold — so this is a shortlist, clearly a
 * shortlist, and any family name can be typed instead. The Arabic entries are
 * the ones that actually have real Arabic coverage rather than a Latin face
 * with a fallback.
 */
export const SUGGESTED_FONTS: { latin: string[]; arabic: string[] } = {
  latin: ["Inter", "Manrope", "DM Sans", "Space Grotesk", "Sora", "Playfair Display", "Libre Baskerville", "IBM Plex Sans"],
  arabic: ["Cairo", "Tajawal", "IBM Plex Sans Arabic", "Almarai", "Readex Pro", "Noto Kufi Arabic", "Amiri", "El Messiri"],
};

/** A response that did arrive, so its status can be reported precisely. */
class FontRequestError extends Error {
  constructor(family: string, status: number) {
    super(
      status === 400
        ? `Google Fonts has no family called “${family}”. Check the spelling — it has to match exactly.`
        : `Google Fonts returned ${status}.`
    );
  }
}

function cssUrl(family: string): string {
  const spec = `${family.trim().replace(/\s+/g, "+")}:wght@${WEIGHTS.join(";")}`;
  return `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
}

/**
 * Splits the stylesheet into faces.
 *
 * Google precedes each `@font-face` with a comment naming its subset
 * (`/* arabic *\/`, `/* latin-ext *\/`). That comment is the only thing that
 * distinguishes the Arabic cut of a family from its Latin one, and importing
 * the wrong cut is how you end up with an "Arabic font" that has no Arabic
 * glyphs in it — so it is parsed rather than ignored.
 */
function parseFaces(css: string): ParsedFace[] {
  const faces: ParsedFace[] = [];
  const re = /\/\*\s*([a-z0-9-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css))) {
    const [, subset, body] = match;
    const url = /src:\s*url\(([^)]+)\)/i.exec(body)?.[1]?.replace(/['"]/g, "");
    if (!url) continue;
    faces.push({
      subset: subset.toLowerCase(),
      weight: Number(/font-weight:\s*(\d+)/i.exec(body)?.[1] ?? 400),
      style: /font-style:\s*italic/i.test(body) ? "italic" : "normal",
      url,
    });
  }
  return faces;
}

/** Which subset to keep for the script the family is being applied to. */
function subsetFor(script: "latin" | "arabic"): string {
  return script;
}

async function toDataUrl(url: string): Promise<{ dataUrl: string; sizeKB: number }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not download the font file (${res.status}).`);
  const blob = await res.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the downloaded font file."));
    reader.readAsDataURL(blob);
  });
  return { dataUrl, sizeKB: Math.max(1, Math.round(blob.size / 1024)) };
}

/**
 * Fetches `family` from Google Fonts and returns its files for `script`.
 *
 * Throws with a message meant to be shown to the person who typed the name —
 * a misspelled family and a family with no Arabic cut are different problems
 * and get different messages.
 */
export async function importGoogleFont(family: string, script: "latin" | "arabic"): Promise<ImportedFontFile[]> {
  const name = family.trim();
  if (!name) throw new Error("Type a font family name first.");

  let css: string;
  try {
    const res = await fetch(cssUrl(name));
    if (!res.ok) throw new FontRequestError(name, res.status);
    css = await res.text();
  } catch (err) {
    if (err instanceof FontRequestError) throw new Error(err.message);
    // A rejected fetch here is usually a misspelled family, not a dead
    // connection: Google answers an unknown family with a 400, and that error
    // response carries no CORS headers, so the browser rejects before the
    // status is readable. The two are genuinely indistinguishable from here,
    // so the message names both rather than guessing and being confidently
    // wrong about the likelier one.
    throw new Error(
      `Couldn't load “${name}” from Google Fonts. Check the spelling — it has to match the family name exactly — or your connection.`
    );
  }

  const faces = parseFaces(css);
  if (faces.length === 0) throw new Error(`Couldn't read any font files out of the response for “${name}”.`);

  const wanted = subsetFor(script);
  let picked = faces.filter((f) => f.subset === wanted);

  if (picked.length === 0) {
    if (script === "arabic") {
      throw new Error(`“${name}” has no Arabic characters in it — pick a family with an Arabic subset.`);
    }
    // Latin is all but guaranteed; if the comments are ever absent, fall back
    // to whatever came back rather than failing over a formatting change.
    picked = faces;
  }

  // One file per weight — the same weight in several subsets would otherwise
  // be declared twice and the later one would simply win.
  const byWeight = new Map<number, ParsedFace>();
  for (const face of picked) {
    if (face.style !== "normal") continue;
    if (!byWeight.has(face.weight)) byWeight.set(face.weight, face);
  }
  const chosen = [...byWeight.values()].sort((a, b) => a.weight - b.weight);
  if (chosen.length === 0) throw new Error(`No upright weights available for “${name}”.`);

  const files: ImportedFontFile[] = [];
  for (const face of chosen) {
    const { dataUrl, sizeKB } = await toDataUrl(face.url);
    files.push({
      family: name,
      weight: face.weight,
      style: face.style,
      fileName: `${name.replace(/\s+/g, "")}-${face.weight}.woff2`,
      dataUrl,
      sizeKB,
    });
  }
  return files;
}
