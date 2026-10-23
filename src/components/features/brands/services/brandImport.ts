"use client";

/**
 * Reads a real brand-guideline document and reports what is actually in it.
 *
 * This replaces the canned result the "Import from a PDF" flow used to return.
 * Everything below is measured from the file the studio uploaded: the palette
 * comes from rendering the pages and sampling their pixels, the typefaces are
 * the fonts the PDF genuinely embeds, and the strategy text is matched against
 * headings that literally appear in the document. A field nothing was found
 * for comes back absent — never filled with a plausible-looking guess.
 *
 * It runs entirely in the browser: pdf.js renders and parses locally, no page
 * of the document is uploaded anywhere, and no model is called. That is also
 * its limit, and the UI says so — it finds what is written down, not what a
 * reader would infer.
 */

import { ExtractedColor, extractPalette } from "@/lib/extractPalette";
import { ParsedStrategy, extractText, parseStrategyDocument } from "@/lib/docParse";
import { hexToRgb, rgbToHsl } from "@/lib/utils";

/** A typeface the PDF embeds, with the evidence for which script it sets. */
export interface DetectedFont {
  /** Subset prefixes ("ABCDEF+") stripped — the family as the document names it. */
  name: string;
  /** Characters this font was used to set, by script. */
  arabicChars: number;
  latinChars: number;
  script: "arabic" | "latin" | "mixed";
}

export interface DocumentAnalysis {
  fileName: string;
  /** Plain text pulled out of the document, for the strategy matcher. */
  text: string;
  strategy: ParsedStrategy;
  /** Measured from the rendered pages. Empty for .docx, which has no page render. */
  colors: ExtractedColor[];
  /** Embedded fonts. Empty for .docx — the format doesn't carry them. */
  fonts: DetectedFont[];
  pagesRendered: number;
  pageCount: number;
  /** Set when a stage couldn't run, so the UI can say which rather than going quiet. */
  notes: string[];
}

/** Pages sampled for the palette. The first spreads carry the colour system;
 *  rendering all 80 pages of a real guideline would cost minutes for no gain. */
const PALETTE_PAGES = 6;
/** Pages whose operator list is built so their fonts can be named. */
const FONT_RESOLVE_PAGES = 12;
const RENDER_WIDTH = 720;
/** Below this share a colour is page furniture — a rule, a caption, an edge. */
const MIN_COLOR_SHARE = 0.01;
/** Below this, a colour is shown but not ticked by default. */
const MIN_SUGGEST_SHARE = 0.05;
/** A desaturated colour covering more than this much of a page is page stock. */
const PAGE_STOCK_SHARE = 0.5;

const ARABIC_CHARS = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g;
const LATIN_CHARS = /[A-Za-z]/g;

function stripSubsetPrefix(name: string): string {
  return name.replace(/^[A-Z]{6}\+/, "").trim();
}

async function loadPdfjs() {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  return pdfjsLib;
}

async function analyzePdf(file: File, onProgress?: (label: string) => void): Promise<DocumentAnalysis> {
  const pdfjsLib = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;

  const notes: string[] = [];
  const lines: string[] = [];
  /** Usage counts keyed by pdf.js's internal font id. */
  const fontUse = new Map<string, { arabic: number; latin: number }>();
  /** Internal id → the family name the document declares, resolved as pages load. */
  const fontLabels = new Map<string, string>();

  onProgress?.(`Reading ${doc.numPages} pages…`);

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();

    let lastY: number | null = null;
    let currentLine = "";
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        lines.push(currentLine.trim());
        currentLine = "";
      }
      currentLine += currentLine && !currentLine.endsWith(" ") ? ` ${item.str}` : item.str;
      lastY = y;

      // Which script a font actually sets is evidence, not inference: count the
      // characters it was used for. A font named "Neue-Regular" that sets 4,000
      // Arabic characters is the Arabic face, whatever its name suggests.
      if (item.str.trim() && item.fontName) {
        const arabic = (item.str.match(ARABIC_CHARS) || []).length;
        const latin = (item.str.match(LATIN_CHARS) || []).length;
        if (arabic || latin) {
          const entry = fontUse.get(item.fontName) ?? { arabic: 0, latin: 0 };
          entry.arabic += arabic;
          entry.latin += latin;
          fontUse.set(item.fontName, entry);
        }
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());
    lines.push("");

    // Resolve pdf.js's internal font ids ("g_d0_f2") to the family names the
    // document declares. getTextContent alone doesn't register them — the font
    // objects only arrive once the page's operator list is built, so ask for
    // that first. It costs a pass per page, hence the cap: past it, a font that
    // hasn't appeared yet is unlikely to be one of the brand's.
    if (pageNum <= FONT_RESOLVE_PAGES) {
      try {
        await page.getOperatorList();
        const objs = page.commonObjs as unknown as { has(k: string): boolean; get(k: string): { name?: string } };
        for (const id of fontUse.keys()) {
          if (fontLabels.has(id)) continue;
          if (objs.has(id)) {
            const resolved = objs.get(id)?.name;
            if (resolved) fontLabels.set(id, stripSubsetPrefix(resolved));
          }
        }
      } catch {
        // Leave the ids unresolved — they're dropped below rather than shown.
      }
    }
  }

  // Fold the per-id counts onto the resolved family names: one family can be
  // embedded under several ids (one per weight or subset). An id that never
  // resolved is dropped — "g_d0_f2" is pdf.js's internal handle, and offering
  // it as a typeface the studio could adopt would be worse than saying nothing.
  const byFamily = new Map<string, { arabic: number; latin: number }>();
  let unresolved = 0;
  for (const [id, counts] of fontUse) {
    const label = fontLabels.get(id);
    if (!label) {
      unresolved++;
      continue;
    }
    const entry = byFamily.get(label) ?? { arabic: 0, latin: 0 };
    entry.arabic += counts.arabic;
    entry.latin += counts.latin;
    byFamily.set(label, entry);
  }
  if (unresolved > 0) {
    notes.push(
      `${unresolved} font${unresolved === 1 ? "" : "s"} couldn't be named — the document doesn't declare a family for them.`
    );
  }

  const fonts: DetectedFont[] = [...byFamily.entries()]
    .map(([name, c]) => ({
      name,
      arabicChars: c.arabic,
      latinChars: c.latin,
      script: (c.arabic > 0 && c.latin > 0
        ? c.arabic > c.latin * 2
          ? "arabic"
          : c.latin > c.arabic * 2
            ? "latin"
            : "mixed"
        : c.arabic > 0
          ? "arabic"
          : "latin") as DetectedFont["script"],
    }))
    .sort((a, b) => b.arabicChars + b.latinChars - (a.arabicChars + a.latinChars));

  if (fonts.length === 0) notes.push("No embedded fonts declared — this PDF may be a flattened export.");

  // Palette — rendered pages, sampled pixels.
  onProgress?.("Sampling the pages for colour…");
  const pagesToRender = Math.min(PALETTE_PAGES, doc.numPages);
  const found = new Map<string, ExtractedColor>();
  let rendered = 0;

  for (let pageNum = 1; pageNum <= pagesToRender; pageNum++) {
    try {
      const page = await doc.getPage(pageNum);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: RENDER_WIDTH / base.width });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      rendered++;

      const result = await extractPalette(canvas.toDataURL("image/png"));
      if (!result.ok) continue;
      for (const c of result.colors) {
        if (c.share < MIN_COLOR_SHARE) continue;
        const prev = found.get(c.hex);
        // Keep the strongest showing across pages — a colour that owns one
        // spread matters more than one that edges a dozen.
        if (!prev || c.share > prev.share) found.set(c.hex, c);
      }
    } catch {
      notes.push(`Page ${pageNum} couldn't be rendered for colour sampling.`);
    }
  }

  const colors = [...found.values()].sort((a, b) => b.share - a.share).slice(0, 10);
  if (colors.length === 0 && rendered > 0) notes.push("No colour covered enough of a page to read as a brand colour.");

  const text = lines.join("\n");
  onProgress?.("Matching strategy headings…");
  const strategy = parseStrategyDocument(text);

  return {
    fileName: file.name,
    text,
    strategy,
    colors,
    fonts,
    pagesRendered: rendered,
    pageCount: doc.numPages,
    notes,
  };
}

async function analyzeDocx(file: File): Promise<DocumentAnalysis> {
  const text = await extractText(file);
  return {
    fileName: file.name,
    text,
    strategy: parseStrategyDocument(text),
    colors: [],
    fonts: [],
    pagesRendered: 0,
    pageCount: 0,
    notes: [".docx carries no page render and no embedded fonts — colour and type were skipped."],
  };
}

export async function analyzeBrandDocument(
  file: File,
  onProgress?: (label: string) => void
): Promise<DocumentAnalysis> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return analyzePdf(file, onProgress);
  if (
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return analyzeDocx(file);
  }
  throw new Error("Unsupported file — upload a .pdf or .docx.");
}

/**
 * A starting brand name from the file name. Not extracted from the document:
 * the largest text on a cover page is as often a section label as a brand, and
 * a wrong name presented as "found" is worse than an obvious default.
 */
export function nameFromFileName(fileName: string): string {
  const base = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b(brand|guidelines?|guide|identity|manual|book|v?\d+(\.\d+)*)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return base.replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 40);
}

/**
 * Which measured colours to tick by default.
 *
 * All of them are really in the document, so none is hidden — but a
 * desaturated colour covering most of a page is the paper it was printed on,
 * and a colour covering 2% is an edge or a caption rule. Neither is a brand
 * colour, and pre-selecting them means the studio starts by deleting things.
 */
export function suggestedColors(colors: ExtractedColor[]): ExtractedColor[] {
  return colors
    .filter((c) => {
      if (c.share < MIN_SUGGEST_SHARE) return false;
      const rgb = hexToRgb(c.hex);
      if (!rgb) return false;
      const isNeutral = rgbToHsl(rgb).s < 10;
      return !(isNeutral && c.share > PAGE_STOCK_SHARE);
    })
    .slice(0, 6);
}

/** How many strategy fields the parse actually recovered. */
export function strategyFieldCount(s: ParsedStrategy): number {
  return (
    (["purpose", "vision", "mission", "targetAudienceSummary", "positioningStatement", "uvp"] as const).filter(
      (k) => !!s[k]
    ).length +
    (s.coreValues?.length ? 1 : 0) +
    (s.competitors?.length ? 1 : 0) +
    (s.personas?.length ? 1 : 0) +
    (s.voiceTraits?.length ? 1 : 0)
  );
}
