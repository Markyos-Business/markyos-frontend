export const PAGE_SECTION = { en: "Check", ar: "التدقيق" } as const;

export const COMPLIANCE_TABS = [
  { key: "colors", label: "Asset colours", arLabel: "ألوان الأصول" },
  { key: "copy", label: "Copy linter", arLabel: "مدقّق النصوص" },
] as const;

export type ComplianceTab = (typeof COMPLIANCE_TABS)[number]["key"];
