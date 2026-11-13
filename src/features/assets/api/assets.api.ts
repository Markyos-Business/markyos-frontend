import type { Asset } from "../types";

const ASSETS: Asset[] = [
  { id: "as-01", name: "Riyadh launch hero", nameAr: "صورة إطلاق الرياض", type: "photo", owner: "Nour Haddad", market: "ar-SA", status: "approved", rightsExpiry: "2027-06-30", updatedAt: "2026-11-12T09:30:00Z" },
  { id: "as-02", name: "Primary logo, dark", nameAr: "الشعار الرئيسي، داكن", type: "logo", owner: "Omar Aziz", market: "ar-SA", status: "approved", rightsExpiry: null, updatedAt: "2026-11-10T14:05:00Z" },
  { id: "as-03", name: "Dubai Mall billboard", nameAr: "لوحة دبي مول", type: "photo", owner: "Lina Mansour", market: "ar-AE", status: "rights-expiring", rightsExpiry: "2026-12-05", updatedAt: "2026-11-09T11:00:00Z" },
  { id: "as-04", name: "Ramadan film, 30s", nameAr: "فيلم رمضان، 30 ثانية", type: "video", owner: "Nour Haddad", market: "ar-SA", status: "in-review", rightsExpiry: "2027-03-31", updatedAt: "2026-11-13T08:45:00Z" },
  { id: "as-05", name: "Cairo street series", nameAr: "سلسلة شوارع القاهرة", type: "photo", owner: "Yousef Ali", market: "ar-EG", status: "draft", rightsExpiry: "2027-09-15", updatedAt: "2026-11-08T16:20:00Z" },
  { id: "as-06", name: "Brand guidelines PDF", nameAr: "دليل الهوية PDF", type: "document", owner: "Omar Aziz", market: "ar-AE", status: "approved", rightsExpiry: null, updatedAt: "2026-11-01T10:00:00Z" },
  { id: "as-07", name: "Jeddah corniche", nameAr: "كورنيش جدة", type: "photo", owner: "Lina Mansour", market: "ar-SA", status: "rights-expiring", rightsExpiry: "2026-11-30", updatedAt: "2026-10-28T13:15:00Z" },
  { id: "as-08", name: "Summer campaign 2025", nameAr: "حملة صيف 2025", type: "video", owner: "Yousef Ali", market: "ar-EG", status: "archived", rightsExpiry: "2026-09-01", updatedAt: "2026-09-02T07:00:00Z" },
];

/**
 * The asset library. Mock data with a network-like delay until the backend
 * has an assets endpoint; `fail` makes it reject, to show the error state.
 */
export async function getAssets({ signal, fail = false }: { signal?: AbortSignal; fail?: boolean } = {}): Promise<Asset[]> {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, 700);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
  });
  if (fail) throw new Error("Couldn't load assets.");
  return ASSETS;
}
