import type { ParsedStrategy } from "@/lib/docParse";

/** The studio-wide pages linked from the brands header (and, on a phone, the account menu). */
export const STUDIO_LINKS = [
  { href: "/forms", label: "Forms", arLabel: "النماذج", icon: "clipboard-list" },
  { href: "/studio/board", label: "Board", arLabel: "اللوحة", icon: "th-large" },
  { href: "/templates", label: "Templates", arLabel: "القوالب", icon: "layer-group" },
];

export type BrandSort = "updated" | "name";

/** How a new brand starts: an empty workspace, or one read from an existing guideline. */
export const START_TABS = [
  { key: "scratch", label: "Start from scratch" },
  { key: "import", label: "Import a guideline" },
] as const;

export type StartMode = (typeof START_TABS)[number]["key"];

/** The strategy headings an imported guideline is searched for. */
export const STRATEGY_LABELS: { key: keyof ParsedStrategy; label: string }[] = [
  { key: "purpose", label: "Purpose" },
  { key: "vision", label: "Vision" },
  { key: "mission", label: "Mission" },
  { key: "coreValues", label: "Core values" },
  { key: "targetAudienceSummary", label: "Target audience" },
  { key: "competitors", label: "Competitive analysis" },
  { key: "positioningStatement", label: "Brand positioning" },
  { key: "uvp", label: "Unique value proposition" },
  { key: "personas", label: "Personas" },
  { key: "voiceTraits", label: "Voice & tone" },
];
