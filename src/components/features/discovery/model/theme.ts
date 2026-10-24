import { bestInkOn, contrastRatio } from "@/lib/contrast";
import type { FormTheme } from "../types";

/*
 * The client form's colours, from the studio's theme.
 *
 * The client form is the studio's, not Markyos's, so it doesn't use the app's
 * tokens; it has its own small palette, light or dark, with the studio's
 * accent. Text keeps 4.5:1 in both. The accent is checked too: where it can't
 * be read as text on the form's surface, links and selected states fall back
 * to the text colour and the accent stays for fills, carrying whichever ink
 * reads on it. The Theme screen shows the same warnings so the studio knows.
 */

export type FormPalette = {
  background: string;
  surface: string;
  raised: string;
  text: string;
  muted: string;
  line: string;
  /** The accent as a fill (buttons, progress, selected tiles). */
  accent: string;
  /** Text on an accent fill. */
  accentInk: string;
  /** The accent as text (links, selected labels), or the text colour when the accent can't be read. */
  accentText: string;
};

const BASE = {
  light: { background: "#f5f5f7", surface: "#ffffff", raised: "#f0f0f4", text: "#0d0d0f", muted: "#45454d", line: "rgba(9, 9, 11, 0.16)", accent: "#0062b8" },
  dark: { background: "#000000", surface: "#111111", raised: "#1a1a1a", text: "#ffffff", muted: "#c4c4c4", line: "rgba(255, 255, 255, 0.14)", accent: "#0099ff" },
} as const;

export const MIN_CONTRAST = 4.5;

export type ThemeWarning = "accent_as_text" | "accent_fill";

export const formPalette = (theme: Pick<FormTheme, "accent" | "background">): { palette: FormPalette; warnings: ThemeWarning[] } => {
  const base = BASE[theme.background === "dark" ? "dark" : "light"];
  const accent = theme.accent && /^#[0-9a-f]{6}$/i.test(theme.accent) ? theme.accent : base.accent;
  const warnings: ThemeWarning[] = [];

  const asText = contrastRatio(accent, base.surface) ?? 0;
  if (asText < MIN_CONTRAST) warnings.push("accent_as_text");

  const ink = bestInkOn(accent);
  if (!ink || ink.result.ratio < MIN_CONTRAST) warnings.push("accent_fill");

  return {
    palette: {
      background: base.background,
      surface: base.surface,
      raised: base.raised,
      text: base.text,
      muted: base.muted,
      line: base.line,
      accent,
      accentInk: ink?.ink ?? "#ffffff",
      accentText: asText >= MIN_CONTRAST ? accent : base.text,
    },
    warnings,
  };
};

/** The palette as CSS custom properties, for the form's root element. */
export const paletteVars = (p: FormPalette): Record<string, string> => ({
  "--f-background": p.background,
  "--f-surface": p.surface,
  "--f-raised": p.raised,
  "--f-text": p.text,
  "--f-muted": p.muted,
  "--f-line": p.line,
  "--f-accent": p.accent,
  "--f-accent-ink": p.accentInk,
  "--f-accent-text": p.accentText,
});
