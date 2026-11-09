import type { Lang } from "@/types/lang";

/** The brands gallery and its header, in English and Arabic. */
const en = {
  search: "Search brands",
  searchPlaceholder: "Search brands…",
  yourBrands: "Your brands",
  summary: (count: number, shared: number, owned: number, limit: number | null) =>
    `${count} workspace${count === 1 ? "" : "s"} · ${shared} shared with clients${limit !== null ? ` · ${owned} of ${limit} used` : ""}`,
  limitNote: (type: string, limit: number | null, noun: string) => `${type} accounts own up to ${limit} ${noun}. Contact Markyos to change your plan.`,
  lastEdited: "Last edited",
  nameAz: "Name A–Z",
  newWorkspace: "New workspace",
  sharedLegendBefore: "A brand marked",
  shared: "Shared",
  sharedLegendAfter: "has a live client link — anyone holding it can open the guideline. Switch it off in that brand's Settings.",
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
  limitNote: (type, limit, noun) => `حسابات ${type} تملك حتى ${limit} ${noun}. تواصل مع ماركيوس لتغيير خطتك.`,
  lastEdited: "آخر تعديل",
  nameAz: "الاسم أ–ي",
  newWorkspace: "مساحة عمل جديدة",
  sharedLegendBefore: "العلامة الموسومة بـ",
  shared: "مشاركة",
  sharedLegendAfter: "لها رابط عميل فعّال، ويستطيع أي شخص يملكه فتح الدليل. أوقفه من إعدادات تلك العلامة.",
  edited: (when) => `عُدّلت ${when}`,
  active: "نشطة",
  empty: "فارغة",
  sharedWithYou: (role) => `مشاركة معك بصفة ${role}`,
  draft: "مسودة",
  roles: { owner: "مالك", editor: "محرّر", viewer: "مشاهد", client: "عميل" },
};

export const BRANDS_COPY: Record<Lang, typeof en> = { en, ar };
