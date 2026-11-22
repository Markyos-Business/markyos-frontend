/*
 * Moodboard words added since 22 Nov 2026, as keys in both languages. The
 * rest of the feature still writes inline `isAr ? … : …`; new strings go here.
 */
const en = {
  direction: {
    choose: "Choose as the direction",
    unchoose: "No longer the direction",
    chosen: "Chosen direction",
  },
};

type MoodboardCopy = typeof en;

const ar: MoodboardCopy = {
  direction: {
    choose: "اختيار كاتجاه للعلامة",
    unchoose: "إلغاء اختياره كاتجاه",
    chosen: "الاتجاه المختار",
  },
};

export const moodboardCopy = (isAr: boolean): MoodboardCopy => (isAr ? ar : en);
