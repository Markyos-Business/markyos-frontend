/*
 * Builder words added since 21 Nov 2026, as keys in both languages
 * (screen.element.state). The rest of the builder still writes inline
 * `isAr ? … : …`; new strings go here.
 */
const en = {
  layout: {
    resize: "Resize the tools panel",
    tooSmall: {
      title: "The guideline editor needs a larger screen",
      body: "Open it on a computer or a tablet in landscape, at least 768px wide. You can still view the site from here.",
      view: "View the site",
      back: "Back to the brand",
    },
  },
  publication: {
    status: {
      notLive: "Not live",
      notLiveHint: "Published, but the link doesn't show it: this brand has no plan and isn't your free site.",
      freeSite: "Your free site. It shows the Made with Markyos badge.",
    },
    upgrade: "Upgrade to publish",
    upgradeHint: "Subscribe this brand to put its guideline site live.",
  },
};

type BuilderCopy = typeof en;

const ar: BuilderCopy = {
  layout: {
    resize: "غيّر عرض لوحة الأدوات",
    tooSmall: {
      title: "يحتاج محرر الدليل إلى شاشة أكبر",
      body: "افتحه على حاسوب أو جهاز لوحي بالوضع الأفقي، بعرض 768 بكسل على الأقل. يمكنك عرض الموقع من هنا.",
      view: "اعرض الموقع",
      back: "العودة إلى العلامة",
    },
  },
  publication: {
    status: {
      notLive: "غير متاح للعملاء",
      notLiveHint: "منشور، لكن الرابط لا يعرضه: العلامة بلا خطة وليست موقعك المجاني.",
      freeSite: "موقعك المجاني، وتظهر عليه شارة «صُنع بماركيوس».",
    },
    upgrade: "رقِّ الخطة للنشر",
    upgradeHint: "اشترك لهذه العلامة لنشر موقع دليلها.",
  },
};

export const BUILDER_COPY = { en, ar };
export const builderCopy = (isAr: boolean): BuilderCopy => (isAr ? ar : en);
