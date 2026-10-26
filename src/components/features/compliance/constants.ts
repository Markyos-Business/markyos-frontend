export const PAGE_SECTION = { en: "Compliance", ar: "المطابقة" } as const;

export const COMPLIANCE_TABS = [
  { key: "colors", label: "Asset colors", arLabel: "ألوان الأصول" },
  { key: "copy", label: "Copy linter", arLabel: "مدقّق النصوص" },
] as const;

export type ComplianceTab = (typeof COMPLIANCE_TABS)[number]["key"];
