/*
 * Strategy words added since 22 Nov 2026, as keys in both languages
 * (screen.element.state). The rest of the feature still writes inline
 * `isAr ? … : …`; new strings go here.
 */
const en = {
  sections: {
    nav: "Strategy sections",
    sequence: "Previous and next section",
    empty: "Nothing here yet",
    description: "The layer above the files: why this brand exists, who it is for, and how it sounds. Pick a section from the list.",
  },
  keyTerms: {
    title: "Key terms",
    hint: "The brand's own words: what to say in English and Arabic, and what not to say. Shown read-only on the brand home.",
    say: "Say",
    arabic: "Arabic",
    avoid: "Not",
    sayHint: "e.g. Roastery",
    arabicHint: "مثل: محمصة",
    avoidHint: "e.g. Factory",
    add: "Add term",
    empty: "No key terms yet.",
    actions: (term: string) => `${term} actions`,
    remove: "Remove",
    removeTitle: (term: string) => `Remove “${term}”?`,
    removeBody: "It comes off the brand home's key terms too.",
    unnamed: "This term",
  },
};

type StrategyCopy = typeof en;

const ar: StrategyCopy = {
  sections: {
    nav: "أقسام الاستراتيجية",
    sequence: "القسم السابق والتالي",
    empty: "لا يوجد محتوى بعد",
    description: "الطبقة التي تعلو الملفات: لماذا توجد العلامة، ولمن، وبأي صوت. اختر قسمًا من القائمة.",
  },
  keyTerms: {
    title: "المصطلحات الأساسية",
    hint: "كلمات العلامة نفسها: ما يُقال بالإنجليزية والعربية، وما لا يُقال. تظهر للقراءة فقط على الصفحة الرئيسية للعلامة.",
    say: "قل",
    arabic: "بالعربية",
    avoid: "لا تقل",
    sayHint: "e.g. Roastery",
    arabicHint: "مثل: محمصة",
    avoidHint: "e.g. Factory",
    add: "إضافة مصطلح",
    empty: "لا مصطلحات بعد.",
    actions: (term: string) => `إجراءات ${term}`,
    remove: "حذف",
    removeTitle: (term: string) => `حذف «${term}»؟`,
    removeBody: "يُحذف أيضًا من المصطلحات على الصفحة الرئيسية للعلامة.",
    unnamed: "هذا المصطلح",
  },
};

export const strategyCopy = (isAr: boolean): StrategyCopy => (isAr ? ar : en);
