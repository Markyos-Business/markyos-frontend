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
  const errors = findings.filter((f) => f.severity === "error").length;
  return { findings, errors, warnings: findings.length - errors, checked, pages: pages.length };
}
