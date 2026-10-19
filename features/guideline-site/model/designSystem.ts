/**
 * One design system per guideline template.
 *
 * The templates used to differ only in layout — every one of them painted
 * Markyos's own greys, used Markyos's corner radii and Markyos's type scale,
 * so six "templates" were really one design system with six navigations. A
 * studio choosing a template was choosing where the contents list sits, not
 * what the deliverable looks like.
 *
 * Each entry here is a genuinely separate system: its own ground polarity, its
 * own corner language, its own card treatment, its own type scale and its own
 * appetite for the brand's colour. None of the values are decorative — they are
 * emitted as custom properties that the shared section bodies read, so the same
 * colour grid renders sharp-cornered and outlined under Signal and soft-filled
 * under Atlas without either template forking the component.
 *
 * Colour is never hard-coded here. A system says how far to pull the neutrals
 * toward the brand's hue and how far apart its surfaces sit; the actual values
 * are computed from the workspace's palette in `lib/theme.ts`.
 */

import { GuidelineTemplate, StudioStyle, Workspace } from "@/core/data/types";

export type DesignSystemId = "vault" | "docs" | "prism" | "atlas" | "signal" | "deck" | "manual" | "mosaic";

export interface DesignSystem {
  id: DesignSystemId;
  name: string;
  arName: string;
  /** What a studio is actually choosing — shown on the template picker. */
  note: string;
  arNote: string;

  /** The ground this system is designed around, when the studio hasn't forced one. */
  polarity: "dark" | "light";
  /** 0–1: how much of the brand's hue the neutrals carry. */
  tint: number;
  /** Lightness distance between the ground and each surface level, in %. */
  step: number;

  /** Corner language, in px. `pill` is the nav/button radius. */
  radius: { sm: number; md: number; lg: number; pill: number };

  /**
   * How a content card separates itself from the ground.
   * fill — a solid surface. outline — the ground with a hairline ring.
   * raised — a surface plus a cast shadow.
   */
  card: "fill" | "outline" | "raised";

  display: { hero: number; section: number; tracking: string; weight: number };
  body: { size: number; lead: number };
  label: { size: number; tracking: string; transform: "uppercase" | "none"; weight: number };

  /**
   * How hard the brand's accent is pushed.
   * quiet — links and small marks only. structural — accent carries numbering,
   * rules and active states. loud — accent fills whole bands and headings.
   */
  accent: "quiet" | "structural" | "loud";
  /** Vertical distance between sections, in px. */
  rhythm: number;
}

export const DESIGN_SYSTEMS: Record<DesignSystemId, DesignSystem> = {
  vault: {
    id: "vault",
    name: "Vault",
    arName: "فولت",
    note: "Editorial archive. Dark ground, hairline-outlined cards, numbered chapters in small caps.",
    arNote: "أرشيف تحريري. خلفية داكنة، بطاقات بحدود شعرية، وفصول مرقّمة بأحرف صغيرة.",
    polarity: "dark",
    tint: 0.35,
    step: 5,
    radius: { sm: 4, md: 10, lg: 16, pill: 999 },
    card: "outline",
    display: { hero: 38, section: 30, tracking: "-0.02em", weight: 600 },
    body: { size: 15, lead: 1.7 },
    label: { size: 12, tracking: "0.08em", transform: "uppercase", weight: 600 },
    accent: "structural",
    rhythm: 64,
  },
  docs: {
    id: "docs",
    name: "Docs",
    arName: "دوكس",
    note: "Technical manual. Light paper, near-square corners, generous line height, accent used sparingly.",
    arNote: "دليل تقني. ورق فاتح، زوايا شبه قائمة، تباعد أسطر مريح، ولون مميز مستخدم بحذر.",
    polarity: "light",
    tint: 0.18,
    step: 4,
    radius: { sm: 3, md: 6, lg: 10, pill: 6 },
    card: "outline",
    display: { hero: 30, section: 22, tracking: "-0.01em", weight: 600 },
    body: { size: 15, lead: 1.8 },
    label: { size: 13, tracking: "0", transform: "none", weight: 600 },
    accent: "quiet",
    rhythm: 56,
  },
  prism: {
    id: "prism",
    name: "Prism",
    arName: "بريزم",
    note: "Colour-forward showcase. Heavily brand-tinted ground, big soft corners, oversized display type.",
    arNote: "عرض يقدّم اللون أولًا. خلفية مشبعة بلون العلامة، زوايا كبيرة ناعمة، وخط عريض ضخم.",
    polarity: "dark",
    tint: 0.9,
    step: 6,
    radius: { sm: 10, md: 20, lg: 32, pill: 999 },
    card: "fill",
    display: { hero: 54, section: 34, tracking: "-0.035em", weight: 600 },
    body: { size: 16, lead: 1.65 },
    label: { size: 11, tracking: "0.18em", transform: "uppercase", weight: 600 },
    accent: "loud",
    rhythm: 88,
  },
  atlas: {
    id: "atlas",
    name: "Atlas",
    arName: "أطلس",
    note: "Reference manual. Softly tinted paper, filled cards, quiet accent, a sidebar you read down.",
    arNote: "مرجع منهجي. ورق بلمسة لونية خفيفة، بطاقات ممتلئة، لون مميز هادئ، وقائمة جانبية تُقرأ.",
    polarity: "light",
    tint: 0.5,
    step: 4,
    radius: { sm: 4, md: 12, lg: 20, pill: 999 },
    card: "fill",
    display: { hero: 34, section: 26, tracking: "-0.015em", weight: 600 },
    body: { size: 15, lead: 1.75 },
    label: { size: 10, tracking: "0.12em", transform: "uppercase", weight: 700 },
    accent: "quiet",
    rhythm: 72,
  },
  signal: {
    id: "signal",
    name: "Signal",
    arName: "سيجنال",
    note: "High-contrast dark. Square corners, cards that cast a shadow, wide monospaced labels, loud accent.",
    arNote: "تباين عالٍ وداكن. زوايا قائمة، بطاقات بظل بارز، عناوين متباعدة، ولون مميز صريح.",
    polarity: "dark",
    tint: 0.7,
    step: 7,
    radius: { sm: 0, md: 3, lg: 6, pill: 4 },
    card: "raised",
    display: { hero: 46, section: 32, tracking: "-0.03em", weight: 600 },
    body: { size: 14.5, lead: 1.7 },
    label: { size: 11, tracking: "0.22em", transform: "uppercase", weight: 600 },
    accent: "loud",
    rhythm: 80,
  },
  manual: {
    id: "manual",
    name: "Manual",
    arName: "الدليل المطبوع",
    note: "Printed brand book. White pages, a fixed title rail, hairline rules, dark chapter openers.",
    arNote: "كتيّب هوية مطبوع. صفحات بيضاء، عمود عناوين ثابت، خطوط شعرية، وفواصل فصول داكنة.",
    // The pages are white; the chapter openers invert to a dark ground, which
    // the template takes from the --g-invert-* tokens rather than a fixed hex.
    polarity: "light",
    tint: 0.1,
    step: 3,
    // A printed manual has no rounded corners — its structure comes from rules
    // and margins. The one exception is the pill nav, which is a screen
    // affordance and has no print equivalent to be faithful to.
    radius: { sm: 0, md: 0, lg: 0, pill: 0 },
    card: "outline",
    display: { hero: 40, section: 30, tracking: "-0.02em", weight: 700 },
    body: { size: 15, lead: 1.65 },
    label: { size: 11, tracking: "0", transform: "none", weight: 400 },
    accent: "structural",
    rhythm: 0,
  },
  mosaic: {
    id: "mosaic",
    name: "Mosaic",
    arName: "الفسيفساء",
    note: "Brand hub. A bento grid of tiles — the whole identity at a glance, not a scroll you work down.",
    arNote: "لوحة هوية. شبكة بلاطات تعرض الهوية كاملة في لقطة واحدة، لا تمريرًا طويلًا.",
    // The one light system that is loud with the brand's colour. Atlas is light
    // and quiet, Prism is loud and dark; a tiled hub needs a pale ground for
    // the tiles to read as tiles and a strong accent for the grid to have a
    // focal point, which is a combination none of the others cover.
    polarity: "light",
    tint: 0.28,
    // A wider step than the other light systems: tiles separate from the page
    // by their own fill, not by a rule, so that fill has to be visible.
    step: 5,
    radius: { sm: 10, md: 18, lg: 26, pill: 999 },
    card: "fill",
    display: { hero: 50, section: 24, tracking: "-0.035em", weight: 700 },
    body: { size: 14.5, lead: 1.6 },
    label: { size: 10, tracking: "0.14em", transform: "uppercase", weight: 700 },
    accent: "loud",
    // Tiles sit in a grid with their own gap; a section rhythm on top of it
    // would put two different vertical gaps on the same page.
    rhythm: 0,
  },
  deck: {
    id: "deck",
    name: "Deck",
    arName: "عرض تقديمي",
    note: "Presentation frames. No corners at all, full-bleed colour, display type at slide scale.",
    arNote: "شرائح عرض. بلا زوايا، ألوان تملأ الإطار، وخط بمقاس الشريحة.",
    polarity: "dark",
    tint: 0.6,
    step: 6,
    radius: { sm: 0, md: 0, lg: 0, pill: 0 },
    card: "fill",
    display: { hero: 64, section: 40, tracking: "-0.04em", weight: 600 },
    body: { size: 16, lead: 1.5 },
    label: { size: 12, tracking: "0.14em", transform: "uppercase", weight: 700 },
    accent: "loud",
    rhythm: 0,
  },
};

/**
 * Which design system a workspace's guideline renders in.
 *
 * "studio" is not a system of its own — it is the umbrella over three, so the
 * sub-style is the real choice and this resolves it.
 */
export function designSystemFor(
  template: GuidelineTemplate,
  studioStyle: StudioStyle
): DesignSystem {
  if (template === "studio") return DESIGN_SYSTEMS[studioStyle];
  return DESIGN_SYSTEMS[template];
}

export function designSystemOf(ws: Workspace): DesignSystem {
  return designSystemFor(ws.guidelineTemplate, ws.studioStyle);
}

export const DESIGN_SYSTEM_ORDER: DesignSystemId[] = [
  "vault",
  "docs",
  "prism",
  "atlas",
  "signal",
  "manual",
  "mosaic",
  "deck",
];
