/*
 * Builder words added since 21 Nov 2026, as keys in both languages
 * (screen.element.state). The rest of the builder still writes inline
 * `isAr ? … : …`; new strings go here.
 */
const en = {
  publication: {
    status: {
      notLive: "Not live",
      notLiveHint: "Published, but the link doesn't show it: this brand needs a paid plan to go live.",
    },
    upgrade: "Upgrade to publish",
    upgradeHint: "The guideline site goes live on a paid plan. Choose one in Settings.",
    planRequired: "Not published: going live needs a paid plan. Choose one in Settings.",
  },
};

type BuilderCopy = typeof en;

const ar: BuilderCopy = {
  publication: {
    status: {
      notLive: "غير متاح للعملاء",
      notLiveHint: "منشور، لكن الرابط لا يعرضه: تحتاج العلامة إلى خطة مدفوعة ليصبح الموقع متاحًا.",
    },
    upgrade: "رقِّ الخطة للنشر",
    upgradeHint: "يصبح موقع الدليل متاحًا مع خطة مدفوعة. اخترها من الإعدادات.",
    planRequired: "لم يُنشر: يحتاج النشر إلى خطة مدفوعة. اخترها من الإعدادات.",
  },
};

export const BUILDER_COPY = { en, ar };
export const builderCopy = (isAr: boolean): BuilderCopy => (isAr ? ar : en);
