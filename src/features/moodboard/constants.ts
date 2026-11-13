export const PAGE_SECTION = { en: "Moodboard", ar: "لوح الإلهام" } as const;

/** The board's two views, as its tab row offers them. */
export const VIEW_TABS = [
  { key: "canvas", en: "Board", ar: "اللوح", icon: "th-large" },
  { key: "columns", en: "List", ar: "قائمة", icon: "list-ul" },
] as const;
