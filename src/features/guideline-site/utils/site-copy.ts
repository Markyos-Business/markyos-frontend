import { formatDayMonth, richToPlainText } from "@/components/ui";
import type { Lang, Workspace } from "@/types";
import { strategyText } from "./strategy-lang";

/**
 * The words a template opens on, filled from the brand's own data.
 *
 * Every template used to fall back to the same generic copy — "Brand
 * guideline" as the headline, "Visual identity guidelines" under the logo, an
 * empty "Add an opening line" prompt in the editor — even when the brand had a
 * tagline and a positioning statement sitting in its strategy (review, 25 Nov
 * 2026). This picks the brand's own wording first, in the reader's language,
 * and only then a generic label; one place, so the eight looks agree.
 *
 * A studio's rename (`sectionTitle`) and its own opening line (`sectionNote`)
 * still win: these are only the fallbacks.
 */
export interface SiteCopy {
  /** The hero headline: the purpose, else the tagline, else the brand's name. */
  heroTitle: string;
  /**
   * The line under the headline: whichever of tagline and positioning the
   * headline didn't already use. Empty when the brand has neither, and then
   * nothing renders on the published site.
   */
  openingLine: string;
  /**
   * The opening line for a template whose headline is the brand's name
   * rather than its purpose (Atlas): the tagline, else the positioning.
   */
  lead: string;
  /** The purpose, in the reader's language, as plain text. */
  purpose: string;
  /**
   * The small label above the headline: the brand's name, or — when the
   * headline already is the name — the subtitle, so it isn't said twice.
   */
  eyebrow: string;
  /** A short line under the logo: the tagline, else "Brand guidelines". */
  subtitle: string;
  /** "Updated 25 Nov 2026": the last publish, else the last edit. Empty when unknown. */
  updated: string;
}

function tagline(ws: Workspace, lang: Lang): string {
  const ar = ws.taglineAr?.trim();
  const en = ws.tagline?.trim();
  return (lang === "ar" ? ar || en : en || ar) ?? "";
}

export function siteCopy(ws: Workspace, lang: Lang): SiteCopy {
  const isAr = lang === "ar";
  const purpose = richToPlainText(strategyText(ws.strategy, "purpose", lang)).trim();
  const positioning = richToPlainText(strategyText(ws.strategy, "positioningStatement", lang)).trim();
  const tag = tagline(ws, lang);

  const heroTitle = purpose || tag || ws.name;
  const openingLine = purpose ? tag || positioning : tag ? positioning : "";

  const subtitle = tag || (isAr ? "دليل الهوية" : "Brand guidelines");

  return {
    heroTitle,
    eyebrow: heroTitle === ws.name ? (tag ? (isAr ? "دليل الهوية" : "Brand guidelines") : subtitle) : ws.name,
    openingLine,
    lead: tag || positioning,
    purpose,
    subtitle,
    updated: updatedLabel(ws, lang),
  };
}

/**
 * When this guideline last changed, as a date (MARKYOS_UI §7: "31 Dec 2026").
 *
 * Relative time was wrong here twice over: the editor re-renders as it saves,
 * so it always read "Updated: just now", and a published page cached for a
 * week would keep claiming whatever it said when it was rendered. The published
 * date is what a reader means by "updated"; a draft that was never published
 * falls back to its last edit.
 */
export function updatedLabel(ws: Pick<Workspace, "publishedAt" | "updatedAt">, lang: Lang): string {
  const ts = ws.publishedAt || ws.updatedAt;
  if (!ts || !Number.isFinite(ts)) return "";
  const date = formatDayMonth(new Date(ts), lang, true);
  return lang === "ar" ? `آخر تحديث ${date}` : `Updated ${date}`;
}
