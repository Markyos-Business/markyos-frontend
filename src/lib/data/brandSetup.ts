import type { Workspace } from "@/types";

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

export function brandInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0] ?? "").join("").toLocaleUpperCase();
}
