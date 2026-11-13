import type { ParsedStrategy } from "@/lib/docParse";

export type BrandSort = "updated" | "name";

/** How a new brand starts: an empty workspace, or one read from an existing guideline. */
export const START_TABS = [
  { key: "scratch", label: "Start from scratch", arLabel: "البدء من الصفر" },
  { key: "import", label: "Import a guideline", arLabel: "استيراد دليل" },
] as const;

export type StartMode = (typeof START_TABS)[number]["key"];

/** The strategy headings an imported guideline is searched for. */
export const STRATEGY_LABELS: { key: keyof ParsedStrategy; label: string; arLabel: string }[] = [
  { key: "purpose", label: "Purpose", arLabel: "الغاية" },
  { key: "vision", label: "Vision", arLabel: "الرؤية" },
  { key: "mission", label: "Mission", arLabel: "الرسالة" },
  { key: "coreValues", label: "Core values", arLabel: "القيم الجوهرية" },
  { key: "targetAudienceSummary", label: "Target audience", arLabel: "الجمهور المستهدف" },
  { key: "competitors", label: "Competitive analysis", arLabel: "تحليل المنافسين" },
  { key: "positioningStatement", label: "Brand positioning", arLabel: "تموضع العلامة" },
  { key: "uvp", label: "Unique value proposition", arLabel: "عرض القيمة الفريد" },
  { key: "personas", label: "Personas", arLabel: "الشخصيات" },
  { key: "voiceTraits", label: "Voice & tone", arLabel: "النبرة والأسلوب" },
];
