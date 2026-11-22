/*
 * Check words added since 22 Nov 2026, as keys in both languages. The rest
 * of the feature still writes inline `isAr ? … : …`; new strings go here.
 */
const en = {
  save: {
    score: "Score",
    scoreOf: (n: number) => `${n} / 100`,
    button: "Save this check",
    saved: "Check saved. It counts towards this month's voice on the brand home.",
    failed: "The check couldn't be saved. Try again.",
    privacy:
      "Every rule here is plain: a phrase matches or it doesn't. The check runs on your device and what you type is never sent. Saving a check keeps only its score, its most common note and the date.",
  },
};

type ComplianceCopy = typeof en;

const ar: ComplianceCopy = {
  save: {
    score: "الدرجة",
    scoreOf: (n: number) => `${n} / 100`,
    button: "حفظ هذا الفحص",
    saved: "تم حفظ الفحص. يُحتسب في نبرة هذا الشهر على الصفحة الرئيسية للعلامة.",
    failed: "تعذّر حفظ الفحص. أعد المحاولة.",
    privacy:
      "كل قاعدة هنا واضحة: إما أن تتطابق العبارة أو لا. يجري الفحص على جهازك ولا يُرسل ما تكتبه أبدًا. حفظ الفحص يحتفظ بدرجته وأكثر ملاحظة تكررت والتاريخ فقط.",
  },
};

export const complianceCopy = (isAr: boolean): ComplianceCopy => (isAr ? ar : en);
