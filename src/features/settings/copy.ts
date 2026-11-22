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
    founded: "سنة التأسيس",
    foundedHint: "مثل: 2019",
    saved: "تم الحفظ.",
    overview: "مقدمة الدليل",
    overviewInfo: "النص الافتتاحي لدليل العلامة المنشور، بلغة العلامة.",
    overviewHint: "من هي العلامة، ولمن، وما الذي يميزها.",
  },
};

export const settingsCopy = (isAr: boolean): SettingsCopy => (isAr ? ar : en);
