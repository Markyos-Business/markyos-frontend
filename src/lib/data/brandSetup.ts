import type { Workspace } from "@/types";
import { initialsFor } from "@/lib/utils";

/** Derived from saved brand data, so cards, overview and publishing agree. */
export function brandSetup(ws: Workspace) {
  const base = `/w/${ws.slug}`;
  const purpose = ws.primaryLocale === "ar" ? ws.strategy.purposeAr : ws.strategy.purpose;
  return [
    { key: "logo", label: "Add your logo", arLabel: "أضف شعارك", done: Object.values(ws.logo).some(s => s.phase === "attached"), href: `${base}/visual-identity?tab=logo` },
    { key: "colors", label: "Add brand colours", arLabel: "أضف ألوان العلامة", done: ws.colors.length > 0, href: `${base}/visual-identity?tab=color` },
    { key: "fonts", label: "Choose your fonts", arLabel: "اختر خطوطك", done: !!(ws.typography.latinFamily?.trim() && ws.typography.arabicFamily?.trim()), href: `${base}/visual-identity?tab=typography` },
    { key: "purpose", label: "Write your purpose", arLabel: "اكتب غاية العلامة", done: !!purpose?.trim(), href: `${base}/strategy?tab=purpose` },
    { key: "publish", label: "Publish your guideline", arLabel: "انشر دليل العلامة", done: !!ws.published, href: `${base}/builder` },
  ];
}

/** A brand's fallback mark when it has no logo: one letter (see `initialsFor`). */
export function brandInitials(name: string) {
  return initialsFor(name);
}

/** The brand's logo for an avatar-sized spot: the symbol, else a wordmark in the brand's language. */
export function brandMarkUrl(ws: Pick<Workspace, "logo" | "primaryLocale">): string | null {
  const order = ["symbol", ws.primaryLocale === "ar" ? "arabic" : "latin", ws.primaryLocale === "ar" ? "latin" : "arabic"] as const;
  for (const kind of order) {
    const slot = ws.logo?.[kind];
    if (slot?.phase === "attached" && slot.url) return slot.url;
  }
  return null;
}
