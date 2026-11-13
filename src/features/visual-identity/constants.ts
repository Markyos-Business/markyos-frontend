import type { AssetType } from "@/types";

export type VisualIdentityTab = "files" | "logo" | "color" | "typography" | "patterns" | "graphics" | "illustrations" | "icons";

export const PAGE_SECTION = { en: "Visual identity", ar: "الهوية البصرية" } as const;

export const TABS: { key: VisualIdentityTab; label: string; arLabel: string }[] = [
  { key: "files", label: "Brand files", arLabel: "ملفات الهوية" },
  { key: "logo", label: "Logo system", arLabel: "الشعار" },
  { key: "color", label: "Color", arLabel: "الألوان" },
  { key: "typography", label: "Typography", arLabel: "الخطوط" },
  { key: "patterns", label: "Patterns", arLabel: "الأنماط" },
  { key: "graphics", label: "Graphics", arLabel: "الرسومات" },
  { key: "illustrations", label: "Illustrations", arLabel: "الرسوم التوضيحية" },
  { key: "icons", label: "Icons", arLabel: "الأيقونات" },
];

/** The tabs that are a grid of one asset type. */
export const ASSET_TABS: Partial<Record<VisualIdentityTab, { type: AssetType; title: string; arTitle: string; hint: string }>> = {
  patterns: { type: "pattern", title: "Patterns", arTitle: "الأنماط", hint: "Repeatable surface patterns — backgrounds, textures, and tiled motifs." },
  graphics: { type: "graphic", title: "Graphics", arTitle: "الرسومات", hint: "Standalone graphic elements — badges, dividers, and decorative marks." },
  illustrations: {
    type: "illustration",
    title: "Illustrations",
    arTitle: "الرسوم التوضيحية",
    hint: "Custom illustration work — spot illustrations, characters, and scenes.",
  },
  icons: {
    type: "icon",
    title: "Icons",
    arTitle: "الأيقونات",
    hint: "The icon set — UI glyphs and symbol marks, kept separate from the logo's own symbol slot.",
  },
};
