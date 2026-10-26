export const PAGE_SECTION = { en: "Overview", ar: "نظرة عامة" } as const;

/**
 * Named actions rather than bound callbacks, because "Link" asks a question
 * through the app's own dialog and has to reach the editor's live selection.
 * The switch that runs them lives in the page hook, where both are in scope.
 */
export const TOOLBAR = [
  { icon: "heading", label: "Heading", action: "heading" },
  { icon: "bold", label: "Bold", action: "bold" },
  { icon: "italic", label: "Italic", action: "italic" },
  { icon: "link", label: "Link", action: "link" },
  { icon: "list-ul", label: "List", action: "list" },
  { icon: "quote-right", label: "Quote", action: "quote" },
] as const;

export type ToolbarAction = (typeof TOOLBAR)[number]["action"];

/** The brand details that edit in place, with their labels. */
export const DETAIL_FIELDS = [
  { key: "industry", en: "Industry", ar: "الصناعة", placeholder: "e.g. Brand & identity design" },
  { key: "tagline", en: "Tagline", ar: "الشعار الترويجي", placeholder: "A short line that sums up the brand" },
  { key: "foundedYear", en: "Founded", ar: "سنة التأسيس", placeholder: "e.g. 2019" },
] as const;

export type DetailField = (typeof DETAIL_FIELDS)[number]["key"];
