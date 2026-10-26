/**
 * Layers · Insert · Template · Site. Layers comes first because it is the one
 * you come back to: what is on this page, in what order. The rest are things
 * you do once and then stop thinking about.
 *
 * "template" is where the guideline site's template is chosen, with the starter
 * sections built for it; "style" is the ground the site is set on.
 */
export const TOOL_TABS = [
  { key: "layers", en: "Layers", ar: "الطبقات" },
  { key: "elements", en: "Insert", ar: "إضافة" },
  { key: "template", en: "Template", ar: "القالب" },
  { key: "style", en: "Site", ar: "الموقع" },
] as const;

export type ToolTab = (typeof TOOL_TABS)[number]["key"];

export const SITE_MODES = [
  { key: "auto", en: "Auto", ar: "تلقائي" },
  { key: "light", en: "Light", ar: "فاتح" },
  { key: "dark", en: "Dark", ar: "داكن" },
] as const;

/** The design panel's width; the canvas always lays out as though it were open. */
export const PANEL_W = 300;
