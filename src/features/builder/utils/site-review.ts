import { brandSetup } from "@/lib/data/brandSetup";
import type { Workspace } from "@/types";
import { reviewPage, type ReviewFinding, type ReviewReport } from "./page-review";

/**
 * The pre-publish check for the whole guideline, not just the page on screen.
 *
 * Publishing sends every page at once, so a gap on a page nobody has open is
 * just as public as one on the page being edited. Each finding says which page
 * it is on, and setup gaps carry the address of the screen that fixes them.
 *
 * Blocking vs warning: a missing logo or palette leaves sections of the
 * published site empty, so those are errors alongside broken sections and
 * links. Fonts and purpose have sensible fallbacks, so they are warnings.
 * Errors block publishing: the builder stops at them, and the server refuses
 * the same list (`apps/brands/publish_check.py`). Keep the two in step.
 */
export interface SiteFinding extends ReviewFinding {
  /** The page the finding is on; null for the home page and for brand setup. */
  pageId: string | null;
  pageName: string;
  arPageName: string;
  /** Set when the fix lives on another screen (brand setup). */
  href?: string;
}

export interface SiteReport extends ReviewReport {
  findings: SiteFinding[];
  /** How many pages were reviewed, home included. */
  pages: number;
}

/** Setup steps whose absence leaves published sections empty. */
const BLOCKING_SETUP = new Set(["logo", "colors"]);

export function reviewSite(ws: Workspace): SiteReport {
  const brand = {
    logoSlotsFilled: Object.values(ws.logo).filter((s) => s.phase === "attached").length,
    colorCount: ws.colors.length,
    iconAssetCount: ws.assets.filter((a) => a.type === "icon").length,
  };
  const pages = [
    { id: null as string | null, name: "Home", arName: "الرئيسية", blocks: ws.customBlocks },
    ...[...ws.pages].sort((a, b) => a.order - b.order).map((p) => ({ id: p.id as string | null, name: p.name, arName: p.arName || p.name, blocks: p.blocks })),
  ];

  const setup: SiteFinding[] = brandSetup(ws)
    .filter((step) => step.key !== "publish" && !step.done)
    .map((step) => {
      const blocking = BLOCKING_SETUP.has(step.key);
      return {
        id: `setup:${step.key}`,
        flowId: `setup:${step.key}`,
        severity: blocking ? "error" : "warning",
        label: step.label,
        arLabel: step.arLabel,
        message: blocking
          ? "Sections that show this stay empty on the published guideline."
          : "The guideline falls back to a default until you add this.",
        arMessage: blocking
          ? "الأقسام التي تعرض هذا ستبقى فارغة في الدليل المنشور."
          : "يستخدم الدليل قيمة افتراضية إلى أن تضيف هذا.",
        pageId: null,
        pageName: "Brand setup",
        arPageName: "إعداد العلامة",
        href: step.href,
      };
    });

  const findings: SiteFinding[] = [...setup];
  let checked = 0;
  for (const page of pages) {
    const report = reviewPage({ blocks: page.blocks, traits: ws.strategy.voiceTraits, brand });
    checked += report.checked;
    for (const f of report.findings) {
      findings.push({ ...f, id: `${page.id ?? "home"}:${f.id}`, pageId: page.id, pageName: page.name, arPageName: page.arName });
    }
  }
  findings.push(...sectionTextGaps(ws));
  const errors = findings.filter((f) => f.severity === "error").length;
  return { findings, errors, warnings: findings.length - errors, checked, pages: pages.length };
}

/** The built-in sections' names, for findings about the studio's own text on them. */
const SECTION_NAMES: Record<string, [string, string]> = {
  overview: ["Overview", "نظرة عامة"],
  "overview-eyebrow": ["Overview", "نظرة عامة"],
  "overview-title": ["Overview", "نظرة عامة"],
  statement: ["Statement", "العبارة"],
  strategy: ["Strategy", "الاستراتيجية"],
  logo: ["Logo", "الشعار"],
  misuse: ["Misuse", "استخدامات خاطئة"],
  "app-icon": ["App icon", "أيقونة التطبيق"],
  color: ["Color", "الألوان"],
  typography: ["Type", "الخطوط"],
  mockups: ["In use", "التطبيقات"],
  photography: ["Photo", "التصوير"],
  patterns: ["Pattern", "النقوش"],
  icons: ["Icons", "الأيقونات"],
  personas: ["Personas", "الشخصيات"],
  voice: ["Voice", "الصوت"],
};

/**
 * The studio's own words on the built-in sections, checked for both languages.
 *
 * Authored sections are checked block by block in page-review. The built-in
 * ones (Logo, Color…) carry only what a studio types onto them: a note under
 * the heading and a renamed heading. Neither falls back like a block does — a
 * note written in one language is simply absent from the other site, and a
 * heading renamed in one language leaves the other on the template's wording —
 * so both are warnings: nothing breaks, but the two sites now say different
 * things.
 */
function sectionTextGaps(ws: Workspace): SiteFinding[] {
  const has = (v: string | undefined) => !!v && v.replace(/<[^>]*>/g, "").trim().length > 0;
  const out: SiteFinding[] = [];
  const where = { pageId: null, pageName: "Home", arPageName: "الرئيسية" };
  const name = (id: string) => SECTION_NAMES[id] ?? [id, id];
  for (const [id, note] of Object.entries(ws.sectionNotes ?? {})) {
    const [label, arLabel] = name(id);
    if (has(note?.en) && !has(note?.ar)) {
      out.push({ ...where, id: `home:${id}:note-ar-missing`, flowId: id, severity: "warning", label, arLabel,
        message: "Note written in English only — the Arabic site leaves it out.",
        arMessage: "الملاحظة مكتوبة بالإنجليزية فقط — لا تظهر في الموقع العربي." });
    } else if (has(note?.ar) && !has(note?.en)) {
      out.push({ ...where, id: `home:${id}:note-en-missing`, flowId: id, severity: "warning", label, arLabel,
        message: "Note written in Arabic only — the English site leaves it out.",
        arMessage: "الملاحظة مكتوبة بالعربية فقط — لا تظهر في الموقع الإنجليزي." });
    }
  }
  for (const [id, title] of Object.entries(ws.sectionTitles ?? {})) {
    const [label, arLabel] = name(id);
    if (has(title?.en) && !has(title?.ar)) {
      out.push({ ...where, id: `home:${id}:title-ar-missing`, flowId: id, severity: "warning", label, arLabel,
        message: "Heading renamed in English only — the Arabic site keeps the template's heading.",
        arMessage: "غُيّر العنوان بالإنجليزية فقط — يبقى عنوان القالب في الموقع العربي." });
    } else if (has(title?.ar) && !has(title?.en)) {
      out.push({ ...where, id: `home:${id}:title-en-missing`, flowId: id, severity: "warning", label, arLabel,
        message: "Heading renamed in Arabic only — the English site keeps the template's heading.",
        arMessage: "غُيّر العنوان بالعربية فقط — يبقى عنوان القالب في الموقع الإنجليزي." });
    }
  }
  return out;
}
