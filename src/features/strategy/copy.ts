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
};

type StrategyCopy = typeof en;

const ar: StrategyCopy = {
  sections: {
    nav: "أقسام الاستراتيجية",
    sequence: "القسم السابق والتالي",
    empty: "لا يوجد محتوى بعد",
    description: "الطبقة التي تعلو الملفات: لماذا توجد العلامة، ولمن، وبأي صوت. اختر قسمًا من القائمة.",
  },
};

export const strategyCopy = (isAr: boolean): StrategyCopy => (isAr ? ar : en);
