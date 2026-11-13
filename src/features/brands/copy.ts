import type { AccountType } from "@/types";
import { accountExperience } from "@/lib/data/accountExperience";
import type { Lang } from "@/types/lang";

/** The brands gallery and its header, in English and Arabic. */
const en = {
  search: "Search brands",
  searchPlaceholder: "Search brands…",
  yourBrands: "Your brands",
  summary: (count: number, shared: number, owned: number, limit: number | null) =>
    `${count} workspace${count === 1 ? "" : "s"} · ${shared} shared with clients${limit !== null ? ` · ${owned} of ${limit} used` : ""}`,
  limitNote: (type: string, limit: number | null, noun: string) => `${type} accounts own up to ${limit} ${noun}. Per-brand plans do not increase this account limit.`,
  reviewPlans: "Review plans & limits",
  lastEdited: "Last edited",
  nameAz: "Name A–Z",
  newWorkspace: "New workspace",
  sharedLegendBefore: "A brand marked",
  shared: "Shared",
  sharedLegendAfter: "has a published guideline link. Its access settings and password still apply.",
  edited: (when: string) => `Edited ${when}`,
  active: "active",
  empty: "empty",
  sharedWithYou: (role: string) => `Shared with you as ${role}`,
  draft: "Draft",
  roles: { owner: "owner", editor: "editor", viewer: "viewer", client: "client" } as Record<string, string>,
};

const ar: typeof en = {
  search: "ابحث في العلامات",
  searchPlaceholder: "ابحث في العلامات…",
  yourBrands: "علاماتك",
  summary: (count, shared, owned, limit) =>
    `${count} ${count === 1 ? "مساحة عمل" : "مساحات عمل"} · ${shared} مشاركة مع العملاء${limit !== null ? ` · ${owned} من ${limit} مستخدمة` : ""}`,
  limitNote: (type, limit, noun) => `حسابات ${type} تملك حتى ${limit} ${noun}. خطط العلامات المدفوعة لا تزيد حد هذا الحساب.`,
  reviewPlans: "مراجعة الخطط والحدود",
  lastEdited: "آخر تعديل",
  nameAz: "الاسم أ–ي",
  newWorkspace: "مساحة عمل جديدة",
  sharedLegendBefore: "العلامة الموسومة بـ",
  shared: "مشاركة",
  sharedLegendAfter: "لها رابط دليل منشور، وتبقى إعدادات الوصول وكلمة المرور سارية.",
  edited: (when) => `عُدّلت ${when}`,
  active: "نشطة",
  empty: "فارغة",
  sharedWithYou: (role) => `مشاركة معك بصفة ${role}`,
  draft: "مسودة",
  roles: { owner: "مالك", editor: "محرّر", viewer: "مشاهد", client: "عميل" },
};

export const BRANDS_COPY: Record<Lang, typeof en> = { en, ar };

/** The company owns its brand; it is not presented as a studio's client. */
export function brandsCopyFor(type: AccountType, lang: Lang): typeof en {
  const copy = BRANDS_COPY[lang];
  const experience = accountExperience(type, lang);
  return { ...copy, summary: (count, shared, owned, limit) => lang === "ar"
    ? `${count} مساحة عمل · ${shared} ${experience.sharedAudience}${limit !== null ? ` · ${owned} من ${limit} مستخدمة` : ""}`
    : `${count} workspace${count === 1 ? "" : "s"} · ${shared} ${experience.sharedAudience}${limit !== null ? ` · ${owned} of ${limit} used` : ""}`,
  };
}
