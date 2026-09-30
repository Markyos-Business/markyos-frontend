/**
 * Resolves a workspace's applied font files into `@font-face` rules and the
 * font stacks that go with them.
 *
 * Shared rather than duplicated because the Type sandbox is worthless if it
 * previews a different font from the Typography page, and both are worthless
 * if the guideline the client opens shows a third. A designer tuning tracking
 * and line-height is tuning them for the face the brand actually ships — so
 * every surface has to resolve the same way from the same data.
 */

import { Asset, Workspace } from "@/lib/types";

/** A CSS-safe @font-face family name for a brand font family. */
export function customFamilyName(key: string): string {
  return `mk-font-${key.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/**
 * Every file belonging to the same family as `asset`.
 *
 * A family imported with regular and bold is two assets; applying either one
 * has to bring the other with it, or `font-weight: 600` renders as a browser-
 * synthesised fake bold next to a real one elsewhere on the page.
 */
export function familyFiles(ws: Workspace, asset: Asset): Asset[] {
  const family = asset.font?.family;
  if (!family) return [asset];
  return ws.assets.filter((a) => a.type === "font" && a.font?.family === family);
}

/** The @font-face family name an asset's family is declared under. */
export function familyKeyOf(asset: Asset): string {
  return asset.font?.family ? customFamilyName(asset.font.family) : customFamilyName(asset.id);
}

function faceRules(ws: Workspace, assetId: string | undefined): string {
  if (!assetId) return "";
  const asset = ws.assets.find((a) => a.id === assetId);
  if (!asset) return "";
  const name = familyKeyOf(asset);
  return familyFiles(ws, asset)
    .map(
      (file) =>
        `@font-face { font-family: "${name}"; src: url("${file.url}"); font-weight: ${
          file.font?.weight ?? 400
        }; font-style: ${file.font?.style ?? "normal"}; font-display: swap; }`
    )
    .join("\n");
}

function stackFor(ws: Workspace, assetId: string | undefined, declared: string, fallbackVar: string): string {
  if (!assetId) return fallbackVar;
  const asset = ws.assets.find((a) => a.id === assetId);
  if (!asset) return fallbackVar;
  // The declared family name stays in the stack behind the real file: if the
  // file fails to load, the browser looks for that family installed locally
  // before dropping all the way to the interface font.
  return `"${familyKeyOf(asset)}", ${declared}`;
}

export interface BrandFontStacks {
  /** Ready for `font-family`, falling back to the app font when nothing is applied. */
  latin: string;
  arabic: string;
  /** The @font-face rules the stacks above depend on. Empty when none apply. */
  css: string;
  /** Whether a real file is backing each stack, for honest labelling. */
  latinIsUploaded: boolean;
  arabicIsUploaded: boolean;
}

export function brandFontStacks(ws: Workspace): BrandFontStacks {
  const latinId = ws.typography.latinFontAssetId;
  const arabicId = ws.typography.arabicFontAssetId;

  return {
    latin: stackFor(ws, latinId, ws.typography.latinFamily, "var(--font-sans)"),
    arabic: stackFor(ws, arabicId, ws.typography.arabicFamily, "var(--font-arabic)"),
    css: [faceRules(ws, latinId), faceRules(ws, arabicId)].filter(Boolean).join("\n"),
    latinIsUploaded: !!latinId && ws.assets.some((a) => a.id === latinId),
    arabicIsUploaded: !!arabicId && ws.assets.some((a) => a.id === arabicId),
  };
}

/**
 * The font custom properties for the guideline site, or `{}` when the brand
 * has applied none.
 *
 * The templates set type with `var(--font-sans)`, `var(--font-arabic)` and
 * `var(--font-display)` — the interface's own faces. Re-pointing those three
 * inside the guideline subtree is what makes an applied brand font reach every
 * heading, caption and body line of the published site at once, instead of
 * only the two specimen cards on the Typography page.
 *
 * A variable is emitted only when a real file backs it. Setting
 * `--font-sans: var(--font-sans)` would be a circular reference, which CSS
 * discards — taking the interface fallback down with it.
 */
export function brandFontVars(fonts: BrandFontStacks, isAr: boolean): Record<string, string> {
  const vars: Record<string, string> = {};
  if (fonts.latinIsUploaded) vars["--font-sans"] = fonts.latin;
  if (fonts.arabicIsUploaded) vars["--font-arabic"] = fonts.arabic;
  // Display is whichever script is being read: an Arabic guideline set in the
  // Latin display face is the bug this fixes, not a style choice.
  const display = isAr ? fonts.arabic : fonts.latin;
  const displayIsReal = isAr ? fonts.arabicIsUploaded : fonts.latinIsUploaded;
  if (displayIsReal) vars["--font-display"] = display;
  return vars;
}
