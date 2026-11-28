/*
 * Settings words added since 22 Nov 2026, as keys in both languages. The
 * brand details and the guideline's overview text moved here from the old
 * Overview page, which now only shows the brand (Overview redesign).
 */
const en = {
  details: {
    industry: "Industry",
    industryHint: "e.g. Specialty coffee",
    tagline: "Tagline (English)",
    taglineAr: "Tagline (Arabic)",
    taglineHint: "A short line that sums up the brand",
    taglineArHint: "سطر قصير يلخّص العلامة",
    /** Under an empty tagline whose other language is written (language parity, 28 Nov 2026). */
    taglineMissingAr: "Not written in Arabic yet: the Arabic guideline shows the English tagline.",
    taglineMissingEn: "Not written in English yet: the English guideline shows the Arabic tagline.",
    founded: "Founded",
    foundedHint: "e.g. 2019",
    saved: "Saved.",
    overview: "Guideline overview",
    overviewInfo: "The opening text of the published guideline, in the brand language.",
    overviewHint: "Who the brand is, who it's for, and what sets it apart.",
  },
};

type SettingsCopy = typeof en;

const ar: SettingsCopy = {
  details: {
    industry: "القطاع",
    industryHint: "مثل: القهوة المختصة",
    tagline: "الشعار الترويجي (بالإنجليزية)",
    taglineAr: "الشعار الترويجي (بالعربية)",
    taglineHint: "A short line that sums up the brand",
    taglineArHint: "سطر قصير يلخّص العلامة",
    taglineMissingAr: "لم يُكتب بالعربية بعد: يعرض الدليل العربي الشعار الإنجليزي.",
    taglineMissingEn: "لم يُكتب بالإنجليزية بعد: يعرض الدليل الإنجليزي الشعار العربي.",
    founded: "سنة التأسيس",
    foundedHint: "مثل: 2019",
    saved: "تم الحفظ.",
    overview: "مقدمة الدليل",
    overviewInfo: "النص الافتتاحي لدليل العلامة المنشور، بلغة العلامة.",
    overviewHint: "من هي العلامة، ولمن، وما الذي يميزها.",
  },
};

export const settingsCopy = (isAr: boolean): SettingsCopy => (isAr ? ar : en);
