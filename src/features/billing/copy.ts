import { plural } from "@/lib/i18n/plural";
import type { UpgradeReason } from "./types";

/*
 * Billing words (billing epic, 22 Nov 2026), as keys in both languages. The
 * Arabic is a draft to align with «دليل نصوص الواجهة». Company accounts are
 * never told about clients or studios.
 */
type Copy = {
  reason: Record<UpgradeReason, { title: string; body: (brand: string) => string; done: string }>;
  price: (amount: string) => string;
  terms: string;
  includes: { title: string; publish: string; badge: string; editors: string; brands: string };
  state: {
    confirming: string;
    active: string;
    slow: string;
    keepWaiting: string;
    cancel: string;
    cancelAsk: string;
    cancelAskBody: string;
    cancelled: string;
    failed: string;
    refused: string;
  };
  /** brand_limit when an older account has several brands without a plan. */
  manyFree: (count: number, brand: string) => string;
  notOwner: string;
  unavailable: string;
  close: string;
  continue: string;
};

const en: Copy = {
  reason: {
    publish: {
      title: "Publishing needs a plan",
      body: (b) => `Subscribe ${b} to put its guideline site live. You can keep building it for free.`,
      done: "Continue publishing",
    },
    badge: {
      title: "Removing the badge needs a plan",
      body: (b) => `A subscribed brand can hide the Made with Markyos badge. Subscribe ${b} to switch it off.`,
      done: "Done",
    },
    editor: {
      title: "Editors need a plan on this brand",
      body: (b) => `A brand without a plan has no editors. Subscribe ${b} to add editors, or add them as viewers.`,
      done: "Continue",
    },
    brand_limit: {
      title: "Subscribe to add another brand",
      body: (b) => `Your account has one brand without a plan: ${b}. Subscribe it to add another.`,
      done: "Add a brand",
    },
    billing: {
      title: "Subscribe this brand",
      body: (b) => `A monthly plan for ${b}.`,
      done: "Done",
    },
  },
  price: (amount) => `${amount} a month, for this brand`,
  terms: "Billed monthly through PayPal. Cancel any time; access lasts to the end of the month you paid for.",
  includes: {
    title: "With a plan",
    publish: "The guideline site goes live",
    badge: "No Made with Markyos badge",
    editors: "Editors on this brand",
    brands: "Room for another brand without a plan",
  },
  state: {
    confirming: "Confirming with PayPal…",
    active: "Subscribed. The plan is active.",
    slow: "PayPal is still confirming. You can close this and carry on: the plan activates on its own, and the brand updates when it does.",
    keepWaiting: "Keep waiting",
    cancel: "Cancel the subscription",
    cancelAsk: "Cancel this subscription?",
    cancelAskBody: "PayPal stops it and nothing more is charged. The brand stays without a plan.",
    cancelled: "The subscription was cancelled. Nothing more will be charged.",
    failed: "The subscription couldn't be confirmed. Nothing was granted; try again or contact us.",
    refused: "PayPal's terms didn't match ours, so this subscription grants nothing and will be cancelled. Contact us if you were charged.",
  },
  manyFree: (n, b) => `Your account has ${n} brands without a plan, and each needs one before you add another. Start with ${b}.`,
  notOwner: "Only the brand's owner can subscribe. Ask them to subscribe this brand.",
  unavailable: "PayPal payments aren't set up yet.",
  close: "Close",
  continue: "Continue",
};

const ar: Copy = {
  reason: {
    publish: {
      title: "النشر يحتاج إلى خطة",
      body: (b) => `اشترك في خطة لـ«${b}» لينشر موقع دليلها. يمكنك مواصلة بنائها مجانًا.`,
      done: "متابعة النشر",
    },
    badge: {
      title: "إخفاء الشارة يحتاج إلى خطة",
      body: (b) => `العلامة المشتركة تستطيع إخفاء شارة «صُنع بماركيوس». اشترك لـ«${b}» لإخفائها.`,
      done: "تم",
    },
    editor: {
      title: "المحررون يحتاجون إلى خطة لهذه العلامة",
      body: (b) => `العلامة بلا خطة ليس لها محررون. اشترك لـ«${b}» لإضافة محررين، أو أضفهم كمشاهدين.`,
      done: "متابعة",
    },
    brand_limit: {
      title: "اشترك لإضافة علامة أخرى",
      body: (b) => `في حسابك علامة واحدة بلا خطة: «${b}». اشترك لها لتضيف علامة أخرى.`,
      done: "إضافة علامة",
    },
    billing: {
      title: "اشترك لهذه العلامة",
      body: (b) => `خطة شهرية لـ«${b}».`,
      done: "تم",
    },
  },
  price: (amount) => `${amount} شهريًا، لهذه العلامة`,
  terms: "تُدفع شهريًا عبر PayPal. ألغِ متى شئت، ويبقى الوصول حتى نهاية الشهر المدفوع.",
  includes: {
    title: "مع الخطة",
    publish: "يُنشر موقع الدليل",
    badge: "بلا شارة «صُنع بماركيوس»",
    editors: "محررون لهذه العلامة",
    brands: "مكان لعلامة أخرى بلا خطة",
  },
  state: {
    confirming: "جارٍ التأكيد مع PayPal…",
    active: "تم الاشتراك. الخطة مفعّلة.",
    slow: "لا يزال PayPal يؤكد الاشتراك. يمكنك الإغلاق والمتابعة: تتفعّل الخطة تلقائيًا وتتحدّث العلامة عندها.",
    keepWaiting: "مواصلة الانتظار",
    cancel: "إلغاء الاشتراك",
    cancelAsk: "أتريد إلغاء هذا الاشتراك؟",
    cancelAskBody: "يوقفه PayPal ولن يُحصَّل أي مبلغ آخر، وتبقى العلامة بلا خطة.",
    cancelled: "أُلغي الاشتراك. لن تُحصَّل أي مبالغ أخرى.",
    failed: "تعذّر تأكيد الاشتراك. لم يُمنح شيء؛ حاول مجددًا أو تواصل معنا.",
    refused: "شروط PayPal لم تطابق شروطنا، فلا يمنح هذا الاشتراك شيئًا وسيُلغى. تواصل معنا إن خُصم منك مبلغ.",
  },
  manyFree: (n, b) =>
    `في حسابك ${plural("ar", n, { one: "علامة واحدة", two: "علامتان", few: "{n} علامات", many: "{n} علامة", other: "{n} علامة" })} بلا خطة، وتحتاج كل منها إلى خطة قبل إضافة علامة أخرى. ابدأ بـ«${b}».`,
  notOwner: "وحده مالك العلامة يستطيع الاشتراك. اطلب منه الاشتراك لهذه العلامة.",
  unavailable: "الدفع عبر PayPal غير مُعدّ بعد.",
  close: "إغلاق",
  continue: "متابعة",
};

export const billingCopy = (isAr: boolean): Copy => (isAr ? ar : en);
export type BillingCopy = Copy;
