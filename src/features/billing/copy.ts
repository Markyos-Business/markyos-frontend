import { plural } from "@/lib/i18n/plural";
import type { CancelReason, UpgradeReason } from "./types";
import type { StatusKey, HistoryStateKey } from "./utils/billing-state";
import type { BillingHistoryItem } from "./types";

/*
 * Billing words (billing epic, 22 Nov 2026), as keys in both languages. The
 * Arabic is a draft to align with «دليل نصوص الواجهة». Company accounts are
 * never told about clients or studios.
 */
type Copy = {
  /** `date`: for resume, when the first charge lands ("18 Dec 2026"). */
  reason: Record<UpgradeReason, { title: string; body: (brand: string, date?: string) => string; done: string }>;
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
  /** The Billing tab in brand settings (billing epic 3.3). */
  tab: {
    label: string;
    description: (brand: string) => string;
    planTitle: string;
    plan: string;
    noPlan: string;
    planName: (type: string) => string;
    pass: string;
    status: string;
    statuses: Record<StatusKey, string>;
    amount: string;
    perMonth: (amount: string) => string;
    nextCharge: string;
    accessUntil: string;
    payer: string;
    freeBody: (brand: string) => string;
    subscribe: string;
    updatePayment: string;
    cancel: string;
    resume: string;
    reactivate: string;
    reactivating: string;
    reactivated: string;
    reactivateFailed: string;
    /** Reactivated, PayPal not paid yet (money first). */
    reactivatedWaiting: string;
    awaitingBody: (brand: string) => string;
    resumesOn: string;
    queuedTitle: string;
    queuedBody: (brand: string, date: string | null) => string;
    failedTitle: string;
    failedBody: (date: string | null) => string;
    suspendedTitle: string;
    suspendedBody: (brand: string) => string;
    cancelledTitle: string;
    cancelledBody: (brand: string, date: string | null) => string;
    legacy: string;
    loadFailed: string;
    retry: string;
    codes: { nothing_to_resume: string; nothing_to_reactivate: string };
    history: {
      title: string;
      date: string;
      type: string;
      amount: string;
      status: string;
      empty: string;
      receipts: string;
      kinds: Record<BillingHistoryItem["kind"], string>;
      states: Record<HistoryStateKey, string>;
    };
  };
  /** Cancelling at the period end (billing epic 3.4). */
  cancelFlow: {
    title: (brand: string) => string;
    description: string;
    /** For a subscription on a brand already back on Free (suspended after the grace). */
    descriptionFree: string;
    reasonLabel: string;
    reasonRequired: string;
    reasons: Record<CancelReason, string>;
    noteLabel: string;
    keep: string;
    continue: string;
    back: string;
    offerTitle: string;
    offer: (date: string | null) => string;
    offerFree: (brand: string) => string;
    confirm: string;
    cancelling: string;
    done: (date: string | null) => string;
    doneFree: string;
    failed: string;
  };
  /** Ownership can't move while a plan is active (D4, billing epic 3.6). */
  transfer: { title: string; body: (brand: string) => string; action: string; close: string };
  /** In every brand page after a failed payment (D6, billing epic 3.2). */
  banner: { failed: (brand: string, date: string) => string; action: string };
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
    resume: {
      title: "Resume the plan",
      body: (b, date) =>
        date
          ? `Resume the plan for ${b} with PayPal. The first charge is on ${date}; nothing is charged before then.`
          : `Resume the plan for ${b} with PayPal. Nothing is charged before the paid month ends.`,
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
  tab: {
    label: "Billing",
    description: (b) => `The plan and payments for ${b}.`,
    planTitle: "Plan",
    plan: "Plan",
    noPlan: "No plan",
    planName: (type) => `${type} plan`,
    pass: "Project Pass",
    status: "Status",
    statuses: {
      active: "Active",
      pending: "Waiting for PayPal",
      paymentFailed: "Payment failed",
      awaitingPayment: "Waiting for payment",
      suspended: "Suspended",
      cancelled: "Cancelled",
      ended: "Ended",
      none: "No plan",
    },
    amount: "Monthly amount",
    perMonth: (a) => `${a} a month`,
    nextCharge: "Next charge",
    accessUntil: "Access until",
    payer: "PayPal account",
    freeBody: (b) => `${b} has no plan. Subscribe to put its guideline site live and add editors.`,
    subscribe: "Subscribe",
    updatePayment: "Update payment method",
    cancel: "Cancel plan",
    resume: "Resume plan",
    reactivate: "Reactivate",
    reactivating: "Reactivating…",
    reactivated: "The plan is active again.",
    reactivateFailed: "Couldn't reactivate the plan. Try again.",
    reactivatedWaiting: "Reactivated. The plan returns once PayPal collects the payment.",
    awaitingBody: (b) => `Reactivated. ${b} returns to its plan once PayPal collects the payment.`,
    resumesOn: "Resumes on",
    queuedTitle: "The plan is resumed",
    queuedBody: (b, d) =>
      d ? `The first charge is on ${d}. Until then ${b} keeps the month already paid for.` : `${b} keeps the month already paid for, then the plan carries on.`,
    failedTitle: "The last payment failed",
    failedBody: (d) => (d ? `Update the payment method by ${d} to keep the plan.` : "Update the payment method to keep the plan."),
    suspendedTitle: "The plan was suspended",
    suspendedBody: (b) => `PayPal couldn't collect the payment, so ${b} is on Free now. Reactivate to have PayPal try again; the plan returns once the payment goes through.`,
    cancelledTitle: "The plan is cancelled",
    cancelledBody: (b, d) =>
      d ? `${b} keeps the plan until ${d}, then moves to Free. Resume before then to keep it.` : `${b} keeps the plan to the end of the paid month, then moves to Free.`,
    legacy: "This plan was bought before payments moved to PayPal. It stays active until 31 Dec 2026; contact us to cancel it sooner.",
    loadFailed: "Couldn't load billing for this brand.",
    retry: "Try again",
    codes: { nothing_to_resume: "There's nothing to resume on this brand.", nothing_to_reactivate: "There's nothing to reactivate on this brand." },
    history: {
      title: "Payment history",
      date: "Date",
      type: "Type",
      amount: "Amount",
      status: "Status",
      empty: "No payments yet.",
      receipts: "PayPal emails a receipt for every payment.",
      kinds: { sale: "Payment", refund: "Refund", reversal: "Reversal", dispute: "Dispute" },
      states: { completed: "Completed", pending: "Pending", refunded: "Refunded", reversed: "Reversed", failed: "Failed", open: "Open", other: "Other" },
    },
  },
  cancelFlow: {
    title: (b) => `Cancel the plan for ${b}`,
    description: "The plan stays until the end of the month you paid for.",
    descriptionFree: "Cancelling stops PayPal from charging this subscription.",
    reasonLabel: "Why are you cancelling?",
    reasonRequired: "Choose a reason.",
    reasons: {
      too_expensive: "It costs too much",
      not_using: "Not using it enough",
      missing_feature: "A feature is missing",
      switching: "Moving to another tool",
      other: "Something else",
    },
    noteLabel: "Anything to add?",
    keep: "Keep plan",
    continue: "Continue",
    back: "Back",
    offerTitle: "Before you cancel",
    offer: (d) =>
      `Your plan stays until ${d ?? "the end of the paid month"} either way. Cancelling stops the next charge, and the brand moves to Free after that. You can resume before then.`,
    offerFree: (b) => `Cancelling stops PayPal from charging this subscription. ${b} stays on Free.`,
    confirm: "Cancel at period end",
    cancelling: "Cancelling…",
    done: (d) => (d ? `The plan is cancelled. Access lasts until ${d}.` : "The plan is cancelled. Access lasts to the end of the paid month."),
    doneFree: "The subscription is cancelled. Nothing more will be charged.",
    failed: "Couldn't cancel the plan. Try again.",
  },
  transfer: {
    title: "Cancel the subscription first",
    body: (b) => `${b} has a subscription that can still charge, so ownership can't move yet. Cancel it at the end of its period, then make the new owner.`,
    action: "Cancel at period end",
    close: "Close",
  },
  banner: {
    failed: (b, d) => `The last payment for ${b} failed. Update the payment method by ${d} to keep the plan.`,
    action: "Open billing",
  },
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
    resume: {
      title: "استئناف الخطة",
      body: (b, date) =>
        date
          ? `استأنف خطة «${b}» عبر PayPal. أول دفعة في ${date}، ولا يُحصَّل شيء قبل ذلك.`
          : `استأنف خطة «${b}» عبر PayPal. لا يُحصَّل شيء قبل نهاية الشهر المدفوع.`,
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
  tab: {
    label: "الفوترة",
    description: (b) => `خطة «${b}» ومدفوعاتها.`,
    planTitle: "الخطة",
    plan: "الخطة",
    noPlan: "بلا خطة",
    planName: (type) => `خطة ${type}`,
    pass: "تصريح المشروع",
    status: "الحالة",
    statuses: {
      active: "مفعّلة",
      pending: "بانتظار PayPal",
      paymentFailed: "تعذّر الدفع",
      awaitingPayment: "بانتظار الدفع",
      suspended: "موقوفة",
      cancelled: "ملغاة",
      ended: "منتهية",
      none: "بلا خطة",
    },
    amount: "المبلغ الشهري",
    perMonth: (a) => `${a} شهريًا`,
    nextCharge: "الدفعة التالية",
    accessUntil: "الوصول متاح حتى",
    payer: "حساب PayPal",
    freeBody: (b) => `لا توجد خطة لـ«${b}». اشترك لنشر موقع دليلها وإضافة محررين.`,
    subscribe: "اشترك",
    updatePayment: "تحديث وسيلة الدفع",
    cancel: "إلغاء الخطة",
    resume: "استئناف الخطة",
    reactivate: "إعادة التفعيل",
    reactivating: "جارٍ إعادة التفعيل…",
    reactivated: "عادت الخطة مفعّلة.",
    reactivateFailed: "تعذّرت إعادة تفعيل الخطة. حاول مرة أخرى.",
    reactivatedWaiting: "أُعيد التفعيل. تعود الخطة حين يحصّل PayPal الدفعة.",
    awaitingBody: (b) => `أُعيد التفعيل. تعود «${b}» إلى خطتها حين يحصّل PayPal الدفعة.`,
    resumesOn: "تُستأنف في",
    queuedTitle: "استُؤنفت الخطة",
    queuedBody: (b, d) =>
      d ? `أول دفعة في ${d}، وحتى ذلك الحين تبقى لـ«${b}» الفترة المدفوعة.` : `تبقى لـ«${b}» الفترة المدفوعة، ثم تستمر الخطة.`,
    failedTitle: "تعذّر الدفع الأخير",
    failedBody: (d) => (d ? `حدّث وسيلة الدفع بحلول ${d} للاحتفاظ بالخطة.` : "حدّث وسيلة الدفع للاحتفاظ بالخطة."),
    suspendedTitle: "أُوقفت الخطة",
    suspendedBody: (b) => `تعذّر على PayPal تحصيل الدفعة، فعادت «${b}» إلى الخطة المجانية. أعد التفعيل ليحاول PayPal مجددًا، وتعود الخطة حين تتم الدفعة.`,
    cancelledTitle: "الخطة ملغاة",
    cancelledBody: (b, d) =>
      d ? `تبقى الخطة لـ«${b}» حتى ${d}، ثم تنتقل إلى الخطة المجانية. استأنفها قبل ذلك للاحتفاظ بها.` : `تبقى الخطة لـ«${b}» حتى نهاية الشهر المدفوع، ثم تنتقل إلى الخطة المجانية.`,
    legacy: "اشتُريت هذه الخطة قبل انتقال الدفع إلى PayPal، وتبقى مفعّلة حتى 31 ديسمبر 2026. تواصل معنا لإلغائها قبل ذلك.",
    loadFailed: "تعذّر تحميل الفوترة لهذه العلامة.",
    retry: "إعادة المحاولة",
    codes: { nothing_to_resume: "لا يوجد ما يُستأنف في هذه العلامة.", nothing_to_reactivate: "لا يوجد ما يُعاد تفعيله في هذه العلامة." },
    history: {
      title: "سجل المدفوعات",
      date: "التاريخ",
      type: "النوع",
      amount: "المبلغ",
      status: "الحالة",
      empty: "لا توجد مدفوعات بعد.",
      receipts: "يرسل PayPal إيصالًا إلى بريدك عن كل دفعة.",
      kinds: { sale: "دفعة", refund: "استرداد", reversal: "عكس دفعة", dispute: "نزاع" },
      states: { completed: "مكتملة", pending: "قيد المعالجة", refunded: "مستردة", reversed: "معكوسة", failed: "فاشلة", open: "مفتوح", other: "أخرى" },
    },
  },
  cancelFlow: {
    title: (b) => `إلغاء خطة «${b}»`,
    description: "تبقى الخطة حتى نهاية الشهر المدفوع.",
    descriptionFree: "يوقف الإلغاء تحصيل PayPal لهذا الاشتراك.",
    reasonLabel: "لماذا تلغي الخطة؟",
    reasonRequired: "اختر سببًا.",
    reasons: {
      too_expensive: "التكلفة مرتفعة",
      not_using: "لا أستخدمها بما يكفي",
      missing_feature: "تنقصها ميزة أحتاجها",
      switching: "سأنتقل إلى أداة أخرى",
      other: "سبب آخر",
    },
    noteLabel: "هل من شيء تضيفه؟",
    keep: "إبقاء الخطة",
    continue: "متابعة",
    back: "رجوع",
    offerTitle: "قبل الإلغاء",
    offer: (d) =>
      `تبقى خطتك حتى ${d ?? "نهاية الشهر المدفوع"} في الحالتين. يوقف الإلغاء الدفعة التالية، وتنتقل العلامة بعدها إلى الخطة المجانية، ويمكنك استئنافها قبل ذلك.`,
    offerFree: (b) => `يوقف الإلغاء تحصيل PayPal لهذا الاشتراك، وتبقى «${b}» على الخطة المجانية.`,
    confirm: "إلغاء عند نهاية الفترة",
    cancelling: "جارٍ الإلغاء…",
    done: (d) => (d ? `أُلغيت الخطة، ويبقى الوصول متاحًا حتى ${d}.` : "أُلغيت الخطة، ويبقى الوصول متاحًا حتى نهاية الشهر المدفوع."),
    doneFree: "أُلغي الاشتراك، ولن يُحصَّل أي مبلغ آخر.",
    failed: "تعذّر إلغاء الخطة. حاول مرة أخرى.",
  },
  transfer: {
    title: "ألغِ الاشتراك أولًا",
    body: (b) => `لدى «${b}» اشتراك قد يُحصِّل مبالغ، فلا يمكن نقل ملكيتها الآن. ألغِه عند نهاية فترته، ثم عيّن المالك الجديد.`,
    action: "إلغاء عند نهاية الفترة",
    close: "إغلاق",
  },
  banner: {
    failed: (b, d) => `تعذّر الدفع الأخير لـ«${b}». حدّث وسيلة الدفع بحلول ${d} للاحتفاظ بالخطة.`,
    action: "فتح الفوترة",
  },
};

export const billingCopy = (isAr: boolean): Copy => (isAr ? ar : en);
export type BillingCopy = Copy;
