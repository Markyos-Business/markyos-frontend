import { plural } from "@/lib/i18n/plural";
import type { AdminCheckoutProvider } from "./types";
import type { CheckoutStatus, CheckoutStatusKey, LimitChoice } from "./utils/billing";

// The admin billing tool's words (billing epic 4.3), in English and Arabic
// (spec §7: sentence case, verb-first buttons, no emoji). Brand names in
// Arabic sentences sit in «».

type Copy = {
  title: string;
  description: string;
  tabsLabel: string;
  tabs: { checkouts: string; codes: string; orphans: string; audit: string };
  providers: Record<AdminCheckoutProvider, string>;
  statuses: Record<CheckoutStatusKey, string>;
  /** The status filter's options: one per stored status, so each can be found. */
  filterStatuses: Record<CheckoutStatus, string>;
  filters: {
    search: string;
    searchLabel: string;
    status: string;
    allStatuses: string;
    provider: string;
    allProviders: string;
  };
  table: {
    label: string;
    itemLabel: string;
    brand: string;
    owner: string;
    provider: string;
    status: string;
    amount: string;
    periodEnd: string;
    created: string;
    deletedBrand: string;
    noOwner: string;
    paymentFailed: string;
  };
  actions: {
    open: string;
    sync: string;
    comp: string;
    endComp: string;
    rowActions: (name: string) => string;
  };
  empty: {
    noneTitle: string;
    noneBody: string;
    noMatchTitle: (q: string) => string;
    noMatchBody: string;
    clear: string;
  };
  orphans: {
    label: string;
    itemLabel: string;
    intro: string;
    subscription: string;
    brand: string;
    paypalStatus: string;
    money: string;
    moneyTaken: string;
    noMoney: string;
    firstSeen: string;
    alerted: string;
    cancelled: string;
    notYet: string;
    emptyTitle: string;
    emptyBody: string;
  };
  audit: {
    label: string;
    itemLabel: string;
    date: string;
    actor: string;
    action: string;
    target: string;
    reason: string;
    change: string;
    system: string;
    noChange: string;
    actions: Record<string, string>;
    emptyTitle: string;
    emptyBody: string;
  };
  detail: {
    back: string;
    breadcrumb: string;
    notFound: string;
    notFoundBody: string;
    loadFailed: string;
    mismatch: string;
    mismatchBody: string;
    refusedBody: string;
    ours: string;
    paypal: string;
    compare: string;
    field: string;
    status: string;
    nextBilling: string;
    lastPayment: string;
    failedPayments: string;
    noPaypal: string;
    facts: string;
    brand: string;
    owner: string;
    provider: string;
    plan: string;
    amount: string;
    perMonth: (amount: string) => string;
    subscriptionId: string;
    created: string;
    paidAt: string;
    periodEnd: string;
    paymentFailedAt: string;
    cancelReason: string;
    cancelNote: string;
    payments: string;
    paymentsEmpty: string;
    paymentDate: string;
    paymentType: string;
    paymentAmount: string;
    paymentStatus: string;
    plans: Record<string, string>;
  };
  sync: {
    title: string;
    description: string;
    reason: string;
    submit: string;
    done: string;
    failed: string;
  };
  comp: {
    title: (brand: string) => string;
    description: string;
    expires: string;
    expiresHint: string;
    reason: string;
    reasonHint: string;
    submit: string;
    done: (brand: string, date: string) => string;
    failed: string;
    errors: {
      reasonRequired: string;
      reasonTooLong: string;
      dateRequired: string;
      datePast: string;
      dateTooFar: string;
    };
  };
  endComp: {
    title: (brand: string) => string;
    body: (brand: string) => string;
    reason: string;
    confirm: string;
    done: string;
    failed: string;
  };
  limits: {
    title: string;
    brands: string;
    editors: string;
    unlimited: string;
    override: string;
    defaults: string;
    action: string;
    dialogTitle: (name: string) => string;
    dialogBody: string;
    choices: Record<LimitChoice, string>;
    number: { brands: string; editors: string };
    reason: string;
    reasonHint: string;
    submit: string;
    done: string;
    failed: string;
    errors: { number: string; reasonRequired: string; reasonTooLong: string; unchanged: string };
  };
  /** D2 on the checkout page: the price moves at renewal. */
  pending: {
    title: string;
    body: (type: string, amount: string, date: string | null) => string;
    approval: string;
    missed: (n: number) => string;
  };
  reasons: Record<string, string>;
  yes: string;
  no: string;
  retry: string;
};

const en: Copy = {
  title: "Billing",
  description: "Checkouts, PayPal subscriptions and comps on every brand",
  tabsLabel: "Billing sections",
  tabs: { checkouts: "Checkouts", codes: "Codes", orphans: "Orphans", audit: "Audit log" },
  providers: { paypal: "PayPal", stripe: "Stripe", comp: "Comp" },
  statuses: {
    active: "Active",
    pending: "Waiting for PayPal",
    suspended: "Suspended",
    cancelled: "Cancelled",
    expired: "Expired",
    paid: "Paid",
    refunded: "Refunded",
    reversed: "Reversed",
    refused: "Refused",
    ended: "Ended",
    other: "Other",
  },
  filterStatuses: {
    pending: "Not sent to PayPal",
    approval_pending: "Waiting for the buyer's approval",
    approved: "Approved, not active yet",
    active: "Active",
    suspended: "Suspended",
    refused: "Refused",
    cancelled: "Cancelled",
    expired: "Expired",
    refunded: "Refunded",
    reversed: "Reversed",
    paid: "Paid (Project Pass)",
    canceled: "Cancelled (Stripe)",
    past_due: "Past due (Stripe)",
    incomplete_expired: "Expired before paying (Stripe)",
  },
  filters: {
    search: "Search brand or owner",
    searchLabel: "Search checkouts",
    status: "Status",
    allStatuses: "All statuses",
    provider: "Provider",
    allProviders: "All providers",
  },
  table: {
    label: "Checkouts",
    itemLabel: "checkouts",
    brand: "Brand",
    owner: "Owner",
    provider: "Provider",
    status: "Status",
    amount: "Amount",
    periodEnd: "Period ends",
    created: "Created",
    deletedBrand: "Deleted brand",
    noOwner: "No owner",
    paymentFailed: "Payment failed",
  },
  actions: {
    open: "Open",
    sync: "Sync from PayPal",
    comp: "Comp a plan",
    endComp: "End comp",
    rowActions: (name) => `${name} actions`,
  },
  empty: {
    noneTitle: "No checkouts yet",
    noneBody: "A checkout appears here when a brand subscribes or is comped.",
    noMatchTitle: (q) => (q ? `No checkouts match “${q}”.` : "No checkouts match these filters."),
    noMatchBody: "Try another brand or owner, or clear the filters.",
    clear: "Clear filters",
  },
  orphans: {
    label: "Orphaned subscriptions",
    itemLabel: "subscriptions",
    intro: "PayPal subscriptions with no live checkout behind them. The server cancels them; this list is read-only.",
    subscription: "Subscription",
    brand: "Brand",
    paypalStatus: "PayPal status",
    money: "Money",
    moneyTaken: "Money taken",
    noMoney: "None taken",
    firstSeen: "First seen",
    alerted: "Alerted",
    cancelled: "Cancelled",
    notYet: "Not yet",
    emptyTitle: "No orphaned subscriptions",
    emptyBody: "Every PayPal subscription has a checkout behind it.",
  },
  audit: {
    label: "Audit log",
    itemLabel: "entries",
    date: "Date",
    actor: "By",
    action: "Action",
    target: "Target",
    reason: "Reason",
    change: "Change",
    system: "System",
    noChange: "No field changed",
    actions: {
      comp_granted: "Comp granted",
      promo_generated: "Promo codes generated",
      promo_disabled: "Promo code disabled",
      promo_batch_disabled: "Promo batch disabled",
      comp_ended: "Comp ended",
      billing_synced: "Synced from PayPal",
      limits_changed: "Limits overridden",
      price_change: "Price change scheduled",
      type_changed: "Account type changed",
    },
    emptyTitle: "No billing actions yet",
    emptyBody: "Syncs, comps and limit overrides are recorded here with their reason.",
  },
  detail: {
    back: "All checkouts",
    breadcrumb: "Billing",
    notFound: "This checkout doesn't exist.",
    notFoundBody: "It may have been removed with its brand.",
    loadFailed: "Couldn't load this checkout.",
    mismatch: "Out of sync with PayPal",
    mismatchBody: "Our status and PayPal's disagree. Sync from PayPal to update our record.",
    refusedBody: "PayPal's terms didn't match ours, so this checkout grants nothing.",
    ours: "Markyos",
    paypal: "PayPal",
    compare: "Markyos and PayPal",
    field: "Field",
    status: "Status",
    nextBilling: "Next billing",
    lastPayment: "Last payment",
    failedPayments: "Failed payments",
    noPaypal: "PayPal isn't involved in this checkout, or couldn't be read.",
    facts: "Details",
    brand: "Brand",
    owner: "Owner",
    provider: "Provider",
    plan: "Plan",
    amount: "Amount",
    perMonth: (a) => `${a} a month`,
    subscriptionId: "Subscription ID",
    created: "Created",
    paidAt: "First paid",
    periodEnd: "Period ends",
    paymentFailedAt: "Payment failed",
    cancelReason: "Cancel reason",
    cancelNote: "Cancel note",
    payments: "Payments",
    paymentsEmpty: "No payments recorded.",
    paymentDate: "Date",
    paymentType: "Type",
    paymentAmount: "Amount",
    paymentStatus: "Status",
    plans: { subscription: "Subscription", pass: "Project Pass", free: "Free" },
  },
  sync: {
    title: "Sync from PayPal",
    description: "Reads the subscription from PayPal and updates our record to match. Nothing is charged.",
    reason: "Reason",
    submit: "Sync from PayPal",
    done: "Synced with PayPal.",
    failed: "Couldn't sync with PayPal. Try again.",
  },
  comp: {
    title: (b) => `Comp a plan for ${b}`,
    description: "The brand gets a subscription plan at no charge until the end of the chosen day. PayPal isn't involved.",
    expires: "Ends on",
    expiresHint: "From tomorrow, up to 2 years.",
    reason: "Reason",
    reasonHint: "Kept in the audit log.",
    submit: "Comp plan",
    done: (b, d) => `${b} is comped until ${d}.`,
    failed: "Couldn't comp the plan. Try again.",
    errors: {
      reasonRequired: "Enter a reason.",
      reasonTooLong: "Keep the reason under 500 characters.",
      dateRequired: "Choose an end date.",
      datePast: "Choose a date from tomorrow.",
      dateTooFar: "A comp can last up to 2 years.",
    },
  },
  endComp: {
    title: (b) => `End the comp for ${b}?`,
    body: (b) => `${b} loses the plan now and moves to Free. Its guideline site goes offline until it subscribes.`,
    reason: "Reason",
    confirm: "End comp",
    done: "Comp ended.",
    failed: "Couldn't end the comp. Try again.",
  },
  limits: {
    title: "Limits",
    brands: "Brands",
    editors: "Editors per brand",
    unlimited: "Unlimited",
    override: "Override",
    defaults: "The account type's limits",
    action: "Override limits",
    dialogTitle: (n) => `Override limits for ${n}`,
    dialogBody: "Brands and editors already there are kept; new ones follow these limits.",
    choices: { default: "Default", unlimited: "Unlimited", number: "Set a number" },
    number: { brands: "Number of brands", editors: "Editors per brand" },
    reason: "Reason",
    reasonHint: "Kept in the audit log.",
    submit: "Save limits",
    done: "Limits saved.",
    failed: "Couldn't save the limits. Try again.",
    errors: { number: "Enter a whole number from 0.", reasonRequired: "Enter a reason.", reasonTooLong: "Keep the reason under 500 characters.", unchanged: "Change a limit first." },
  },
  pending: {
    title: "Price change at renewal",
    body: (type, amount, date) => (date ? `Price change to ${type} (${amount}/month) from ${date}.` : `Price change to ${type} (${amount}/month) from the next renewal.`),
    approval: "Waiting for the owner's approval at PayPal.",
    missed: (n) => `Not approved at ${n} ${n === 1 ? "renewal" : "renewals"}.`,
  },
  reasons: {
    too_expensive: "It costs too much",
    not_using: "Not using it enough",
    missing_feature: "A feature is missing",
    switching: "Moving to another tool",
    other: "Something else",
    abandoned_checkout: "Checkout abandoned",
  },
  yes: "Yes",
  no: "No",
  retry: "Try again",
};

const ar: Copy = {
  title: "الفوترة",
  description: "عمليات الدفع واشتراكات PayPal والخطط المُهداة لكل العلامات",
  tabsLabel: "أقسام الفوترة",
  tabs: { checkouts: "عمليات الدفع", codes: "رموز الخصم", orphans: "اشتراكات يتيمة", audit: "سجل التدقيق" },
  providers: { paypal: "PayPal", stripe: "Stripe", comp: "مُهداة" },
  statuses: {
    active: "مفعّل",
    pending: "بانتظار PayPal",
    suspended: "موقوف",
    cancelled: "ملغى",
    expired: "منتهٍ",
    paid: "مدفوع",
    refunded: "مسترد",
    reversed: "معكوس",
    refused: "مرفوض",
    ended: "منتهٍ",
    other: "أخرى",
  },
  filterStatuses: {
    pending: "لم تُرسل إلى PayPal",
    approval_pending: "بانتظار موافقة المشتري",
    approved: "موافق عليها ولم تُفعَّل بعد",
    active: "مفعّل",
    suspended: "موقوف",
    refused: "مرفوض",
    cancelled: "ملغى",
    expired: "منتهٍ",
    refunded: "مسترد",
    reversed: "معكوس",
    paid: "مدفوع (تصريح المشروع)",
    canceled: "ملغى (Stripe)",
    past_due: "متأخر الدفع (Stripe)",
    incomplete_expired: "انتهى قبل الدفع (Stripe)",
  },
  filters: {
    search: "ابحث باسم العلامة أو المالك",
    searchLabel: "البحث في عمليات الدفع",
    status: "الحالة",
    allStatuses: "كل الحالات",
    provider: "مزوّد الدفع",
    allProviders: "كل المزوّدين",
  },
  table: {
    label: "عمليات الدفع",
    itemLabel: "عمليات الدفع",
    brand: "العلامة",
    owner: "المالك",
    provider: "مزوّد الدفع",
    status: "الحالة",
    amount: "المبلغ",
    periodEnd: "نهاية الفترة",
    created: "أُنشئت",
    deletedBrand: "علامة محذوفة",
    noOwner: "بلا مالك",
    paymentFailed: "تعذّر الدفع",
  },
  actions: {
    open: "فتح",
    sync: "مزامنة من PayPal",
    comp: "إهداء خطة",
    endComp: "إنهاء الخطة المُهداة",
    rowActions: (name) => `إجراءات ${name}`,
  },
  empty: {
    noneTitle: "لا توجد عمليات دفع بعد",
    noneBody: "تظهر عملية الدفع هنا حين تشترك علامة أو تُهدى خطة.",
    noMatchTitle: (q) => (q ? `لا توجد عمليات دفع تطابق «${q}».` : "لا توجد عمليات دفع تطابق هذه المرشحات."),
    noMatchBody: "جرّب علامة أو مالكًا آخر، أو امسح المرشحات.",
    clear: "مسح المرشحات",
  },
  orphans: {
    label: "اشتراكات يتيمة",
    itemLabel: "اشتراكات",
    intro: "اشتراكات PayPal ليس وراءها عملية دفع قائمة. يلغيها الخادم، وهذه القائمة للعرض فقط.",
    subscription: "الاشتراك",
    brand: "العلامة",
    paypalStatus: "حالته في PayPal",
    money: "المال",
    moneyTaken: "حُصّل مال",
    noMoney: "لم يُحصَّل شيء",
    firstSeen: "أول ظهور",
    alerted: "التنبيه",
    cancelled: "الإلغاء",
    notYet: "ليس بعد",
    emptyTitle: "لا توجد اشتراكات يتيمة",
    emptyBody: "لكل اشتراك في PayPal عملية دفع وراءه.",
  },
  audit: {
    label: "سجل التدقيق",
    itemLabel: "سجلات",
    date: "التاريخ",
    actor: "بواسطة",
    action: "الإجراء",
    target: "الهدف",
    reason: "السبب",
    change: "التغيير",
    system: "النظام",
    noChange: "لم يتغيّر أي حقل",
    actions: {
      comp_granted: "أُهديت خطة",
      promo_generated: "أُنشئت رموز خصم",
      promo_disabled: "أُوقف رمز خصم",
      promo_batch_disabled: "أُوقفت دفعة رموز",
      comp_ended: "أُنهيت الخطة المُهداة",
      billing_synced: "مزامنة من PayPal",
      limits_changed: "تعديل الحدود",
      price_change: "جُدول تغيير السعر",
      type_changed: "تغيّر نوع الحساب",
    },
    emptyTitle: "لا توجد إجراءات فوترة بعد",
    emptyBody: "تُسجَّل هنا عمليات المزامنة والخطط المُهداة وتعديل الحدود مع أسبابها.",
  },
  detail: {
    back: "كل عمليات الدفع",
    breadcrumb: "الفوترة",
    notFound: "عملية الدفع هذه غير موجودة.",
    notFoundBody: "ربما حُذفت مع علامتها.",
    loadFailed: "تعذّر تحميل عملية الدفع هذه.",
    mismatch: "غير متزامنة مع PayPal",
    mismatchBody: "حالتها عندنا تختلف عن حالتها في PayPal. زامنها من PayPal لتحديث سجلنا.",
    refusedBody: "شروط PayPal لم تطابق شروطنا، فلا تمنح عملية الدفع هذه شيئًا.",
    ours: "ماركيوس",
    paypal: "PayPal",
    compare: "ماركيوس وPayPal",
    field: "الحقل",
    status: "الحالة",
    nextBilling: "الفوترة التالية",
    lastPayment: "آخر دفعة",
    failedPayments: "الدفعات المتعثّرة",
    noPaypal: "لا علاقة لـ PayPal بعملية الدفع هذه، أو تعذّرت قراءتها منه.",
    facts: "التفاصيل",
    brand: "العلامة",
    owner: "المالك",
    provider: "مزوّد الدفع",
    plan: "الخطة",
    amount: "المبلغ",
    perMonth: (a) => `${a} شهريًا`,
    subscriptionId: "معرّف الاشتراك",
    created: "أُنشئت",
    paidAt: "أول دفعة",
    periodEnd: "نهاية الفترة",
    paymentFailedAt: "تعذّر الدفع",
    cancelReason: "سبب الإلغاء",
    cancelNote: "ملاحظة الإلغاء",
    payments: "المدفوعات",
    paymentsEmpty: "لا توجد مدفوعات مسجّلة.",
    paymentDate: "التاريخ",
    paymentType: "النوع",
    paymentAmount: "المبلغ",
    paymentStatus: "الحالة",
    plans: { subscription: "اشتراك", pass: "تصريح المشروع", free: "مجانية" },
  },
  sync: {
    title: "مزامنة من PayPal",
    description: "يقرأ الاشتراك من PayPal ويحدّث سجلنا ليطابقه، دون تحصيل أي مبلغ.",
    reason: "السبب",
    submit: "مزامنة من PayPal",
    done: "تمت المزامنة مع PayPal.",
    failed: "تعذّرت المزامنة مع PayPal. حاول مرة أخرى.",
  },
  comp: {
    title: (b) => `إهداء خطة لـ«${b}»`,
    description: "تحصل العلامة على خطة اشتراك بلا مقابل حتى نهاية اليوم المختار، دون أي دور لـ PayPal.",
    expires: "تنتهي في",
    expiresHint: "من الغد، حتى سنتين كحد أقصى.",
    reason: "السبب",
    reasonHint: "يُحفظ في سجل التدقيق.",
    submit: "إهداء الخطة",
    done: (b, d) => `أُهديت «${b}» خطة حتى ${d}.`,
    failed: "تعذّر إهداء الخطة. حاول مرة أخرى.",
    errors: {
      reasonRequired: "اكتب سببًا.",
      reasonTooLong: "اجعل السبب أقل من 500 حرف.",
      dateRequired: "اختر تاريخ الانتهاء.",
      datePast: "اختر تاريخًا ابتداءً من الغد.",
      dateTooFar: "لا تتجاوز الخطة المُهداة سنتين.",
    },
  },
  endComp: {
    title: (b) => `أتريد إنهاء الخطة المُهداة لـ«${b}»؟`,
    body: (b) => `تفقد «${b}» الخطة الآن وتنتقل إلى الخطة المجانية، ويتوقف موقع دليلها حتى تشترك.`,
    reason: "السبب",
    confirm: "إنهاء الخطة المُهداة",
    done: "أُنهيت الخطة المُهداة.",
    failed: "تعذّر إنهاء الخطة المُهداة. حاول مرة أخرى.",
  },
  limits: {
    title: "الحدود",
    brands: "العلامات",
    editors: "المحررون لكل علامة",
    unlimited: "بلا حد",
    override: "معدّلة",
    defaults: "حدود نوع الحساب",
    action: "تعديل الحدود",
    dialogTitle: (n) => `تعديل حدود ${n}`,
    dialogBody: "تبقى العلامات والمحررون الحاليون، وتخضع الإضافات الجديدة لهذه الحدود.",
    choices: { default: "الافتراضي", unlimited: "بلا حد", number: "عدد محدد" },
    number: { brands: "عدد العلامات", editors: "عدد المحررين لكل علامة" },
    reason: "السبب",
    reasonHint: "يُحفظ في سجل التدقيق.",
    submit: "حفظ الحدود",
    done: "حُفظت الحدود.",
    failed: "تعذّر حفظ الحدود. حاول مرة أخرى.",
    errors: { number: "اكتب عددًا صحيحًا من 0 فأكثر.", reasonRequired: "اكتب سببًا.", reasonTooLong: "اجعل السبب أقل من 500 حرف.", unchanged: "غيّر أحد الحدود أولًا." },
  },
  pending: {
    title: "تغيير السعر عند التجديد",
    body: (type, amount, date) => (date ? `يتغيّر السعر إلى ${type} (${amount} شهريًا) ابتداءً من ${date}.` : `يتغيّر السعر إلى ${type} (${amount} شهريًا) ابتداءً من التجديد القادم.`),
    approval: "بانتظار موافقة المالك في PayPal.",
    missed: (n) =>
      `لم تتم الموافقة في ${plural("ar", n, { one: "تجديد واحد", two: "تجديدين", few: "{n} تجديدات", many: "{n} تجديدًا", other: "{n} تجديد" })}.`,
  },
  reasons: {
    too_expensive: "التكلفة مرتفعة",
    not_using: "لا يستخدمها بما يكفي",
    missing_feature: "تنقصها ميزة",
    switching: "سينتقل إلى أداة أخرى",
    other: "سبب آخر",
    abandoned_checkout: "تُرك الدفع قبل إكماله",
  },
  yes: "نعم",
  no: "لا",
  retry: "إعادة المحاولة",
};

export const ADMIN_BILLING_COPY = { en, ar } as const;
export type AdminBillingCopy = Copy;
