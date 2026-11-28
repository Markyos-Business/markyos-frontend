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
    /** A section written in one language with fields still missing in the one being edited. */
    toWrite: (n: number, language: string) => `${n} ${n === 1 ? "field" : "fields"} still to write in ${language}`,
    /** The editor's summary line, over every section. */
    toWriteTotal: (n: number, sections: number, language: string) =>
      `${n} ${n === 1 ? "field" : "fields"} in ${sections} ${sections === 1 ? "section" : "sections"} ${n === 1 ? "is" : "are"} written in the other language only. Until you write them in ${language}, readers of the ${language} guideline see them in the other language.`,
    language: { en: "English", ar: "Arabic" },
    firstToWrite: "Go to the first",
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
    toWrite: (n: number, language: string) => (n === 1 ? `حقل واحد بقي لكتابته ب${language}` : n === 2 ? `حقلان بقيا لكتابتهما ب${language}` : `${n} حقول بقيت لكتابتها ب${language}`),
    toWriteTotal: (n: number, sections: number, language: string) =>
      `${n === 1 ? "حقل واحد" : n === 2 ? "حقلان" : `${n} حقول`} في ${sections === 1 ? "قسم واحد" : sections === 2 ? "قسمين" : `${sections} أقسام`} مكتوبة باللغة الأخرى فقط. وإلى أن تكتبها ب${language}، يراها قرّاء الدليل ب${language} باللغة الأخرى.`,
    language: { en: "الإنجليزية", ar: "العربية" },
    firstToWrite: "انتقل إلى أولها",
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
