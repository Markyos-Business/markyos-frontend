/**
 * Design-token interchange — the real version of "two-way Figma sync".
 *
 * There is no Figma API call here and no "Connected" light, because this app
 * has no server to hold an OAuth token and no plugin installed in anyone's
 * Figma file. What it can do honestly is speak the format both sides already
 * read: the W3C Design Tokens Community Group JSON that Figma Variables,
 * Tokens Studio, Style Dictionary and every build pipeline import and export.
 *
 * That makes the round trip genuinely two-way — export the palette and type
 * into a Figma library, edit them there, export back out, import here — with
 * the one difference that the studio moves the file instead of a background
 * job doing it silently. Drift is still caught, and nothing claims a
 * connection that doesn't exist.
 */

import { ColorSwatch, Typography, Workspace } from "@/core/data/types";
import { isValidHex } from "@/shared/lib/utils";

export interface TokenFile {
  $description: string;
  color: Record<string, { $type: "color"; $value: string; $description?: string }>;
  font: Record<string, { $type: "fontFamily"; $value: string; $description?: string }>;
}

function tokenKey(name: string, taken: Set<string>): string {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "color";
  let key = base;
  let n = 2;
  while (taken.has(key)) key = `${base}-${n++}`;
  taken.add(key);
  return key;
}

export function toDesignTokens(ws: Workspace): TokenFile {
  const taken = new Set<string>();
  const color: TokenFile["color"] = {};
  for (const c of ws.colors) {
    color[tokenKey(c.name, taken)] = {
      $type: "color",
      $value: c.hex.toUpperCase(),
      ...(c.isPrimary ? { $description: "Primary brand color" } : {}),
    };
  }
  return {
    $description: `${ws.name} — design tokens exported from Markyos. W3C Design Tokens format; importable by Figma Variables, Tokens Studio and Style Dictionary.`,
    color,
    font: {
      latin: { $type: "fontFamily", $value: ws.typography.latinFamily, $description: "Latin script" },
      arabic: { $type: "fontFamily", $value: ws.typography.arabicFamily, $description: "Arabic script" },
    },
  };
}

export function serializeTokens(ws: Workspace): string {
  return JSON.stringify(toDesignTokens(ws), null, 2);
}

export interface ImportedTokens {
  colors: { name: string; hex: string }[];
  typography: Partial<Typography>;
}

export type TokenParseResult = { ok: true; tokens: ImportedTokens } | { ok: false; error: string };

/**
 * Walks an arbitrarily nested token file and collects every color and
 * fontFamily leaf, naming each by its full path. Deliberately tolerant about
 * *shape* (the DTCG spec is nested; Tokens Studio adds its own wrappers; some
 * exports use `value`/`type` without the `$`) and strict about *content* — a
 * leaf whose value isn't a real hex is skipped, not coerced.
 */
export function parseDesignTokens(raw: string): TokenParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  if (!parsed || typeof parsed !== "object") return { ok: false, error: "That file isn't a token object." };

  const colors: { name: string; hex: string }[] = [];
  const typography: Partial<Typography> = {};

  /**
   * Names a token from its path, minus the group that only says what type it
   * is. Keeping it would name every swatch "Color Accent", which matches no
   * existing swatch — so a file this app exported would re-import as a full
   * set of duplicates instead of updating the palette it came from.
   */
  function titleize(path: string[]): string {
    const meaningful = path.filter(
      (seg, i) => !(i === 0 && /^(color|colors|colour|colours|global|tokens?)$/i.test(seg))
    );
    return (meaningful.length ? meaningful : path)
      .join(" ")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function walk(node: unknown, path: string[]) {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    const obj = node as Record<string, unknown>;

    const type = (obj.$type ?? obj.type) as string | undefined;
    const value = obj.$value ?? obj.value;

    if (typeof value === "string") {
      if (type === "color" || (type === undefined && isValidHex(value))) {
        if (isValidHex(value)) colors.push({ name: titleize(path) || "Imported", hex: value.toUpperCase() });
        return;
      }
      if (type === "fontFamily" || type === "fontFamilies") {
        const leaf = path[path.length - 1]?.toLowerCase() ?? "";
        if (leaf.includes("arab")) typography.arabicFamily = value;
        else if (leaf.includes("latin") || leaf.includes("sans") || leaf.includes("body")) typography.latinFamily = value;
        return;
      }
      return;
    }

    for (const [key, child] of Object.entries(obj)) {
      if (key.startsWith("$")) continue;
      walk(child, [...path, key]);
    }
  }

  walk(parsed, []);

  if (colors.length === 0 && !typography.latinFamily && !typography.arabicFamily) {
    return { ok: false, error: "No color or fontFamily tokens found in that file." };
  }
  return { ok: true, tokens: { colors, typography } };
}

/** Which incoming colors are new, changed, or already match the palette. */
export interface TokenDiff {
  added: { name: string; hex: string }[];
  changed: { swatch: ColorSwatch; hex: string }[];
  unchanged: number;
}

export function diffTokens(current: ColorSwatch[], incoming: { name: string; hex: string }[]): TokenDiff {
  const byName = new Map(current.map((c) => [c.name.trim().toLowerCase(), c]));
  const added: TokenDiff["added"] = [];
  const changed: TokenDiff["changed"] = [];
  let unchanged = 0;

  for (const c of incoming) {
    const match = byName.get(c.name.trim().toLowerCase());
    if (!match) added.push(c);
    else if (match.hex.toUpperCase() !== c.hex.toUpperCase()) changed.push({ swatch: match, hex: c.hex });
    else unchanged++;
  }
  return { added, changed, unchanged };
}
