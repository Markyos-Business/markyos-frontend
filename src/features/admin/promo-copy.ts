import { plural } from "@/lib/i18n/plural";
import type { PromoDuration, PromoStatus } from "@/features/billing";

// Promo codes in the admin billing tool (docs/promo-codes-plan.md §3), in
// English and Arabic (spec §7: sentence case, verb-first buttons, no emoji).
// The server makes every code and works out what a brand pays; these words
// only describe its answers.

type Copy = {
  intro: string;
  generate: string;
  statuses: Record<PromoStatus, string>;
  filters: { batch: string; allBatches: string; status: string; allStatuses: string; batchName: (id: string) => string };
  table: {
    label: string;
    itemLabel: string;
    code: string;
    discount: string;
    uses: string;
    batch: string;
    expires: string;
    status: string;
    created: string;
    never: string;
  };
  /** "1 of 1"; `max` null = no limit. */
  uses: (used: number, max: number | null) => string;
  /** Uses held by checkouts not yet paid: "(1 reserved)". */
  reserved: (n: number) => string;
  /** "50% for 3 months", from the discount's own fields. */
  discount: { percent: (n: string) => string; amount: (a: string) => string; duration: (d: PromoDuration, months: number | null) => string; join: (off: string, when: string) => string };
  actions: { open: string; copy: string; disable: string; disableBatch: string; rowActions: (code: string) => string };
  copied: string;
  copiedAll: string;
  copyFailed: string;
  empty: { noneTitle: string; noneBody: string; noMatchTitle: string; noMatchBody: string; clear: string };
  form: {
    title: string;
    description: string;
    submit: string;
    failed: string;
    count: string;
    countHint: string;
    usesPerCode: string;
    usesHint: string;
    kind: string;
    percent: string;
    amount: string;
    percentOff: string;
    percentHint: string;
    amountOff: string;
    amountHint: string;
    duration: string;
    durations: Record<PromoDuration, string>;
    durationHints: Record<PromoDuration, string>;
    months: string;
    monthsHint: string;
    expires: string;
    expiresHint: string;
    types: string;
    typesHint: string;
    firstPurchase: string;
    firstPurchaseOn: string;
    firstPurchaseOff: string;
    note: string;
    noteHint: string;
    preview: string;
    previewNone: string;
    /** One line per account type: "Studio: USD 14.50 a month for 3 months, then USD 29". */
    previewLine: (type: string, first: string, regular: string, duration: PromoDuration, months: number) => string;
    errors: {
      count: string;
      uses: string;
      percent: string;
      amount: string;
      belowFloor: (type: string) => string;
      months: string;
      expiresPast: string;
      noteRequired: string;
      noteTooLong: string;
    };
  };
  result: {
    title: (n: number) => string;
    description: string;
    label: string;
    copyAll: (n: number) => string;
    csv: string;
    csvFailed: string;
    done: string;
    viewBatch: string;
  };
  disable: {
    title: (code: string) => string;
    body: string;
    reason: string;
    confirm: string;
    done: (code: string) => string;
    failed: string;
  };
  disableBatch: {
    title: string;
    body: string;
    reason: string;
    confirm: string;
    done: string;
    failed: string;
  };
  detail: {
    back: string;
    breadcrumb: string;
    notFound: string;
    notFoundBody: string;
    loadFailed: string;
    facts: string;
    discount: string;
    uses: string;
    batch: string;
    expires: string;
    created: string;
    firstPurchase: string;
    yes: string;
    no: string;
    types: string;
    allTypes: string;
    note: string;
    redemptions: string;
    redemptionsEmpty: string;
    brand: string;
    owner: string;
    date: string;
    redemptionStatus: string;
    payingNow: string;
    paysUntil: (date: string) => string;
    redemptionStatuses: Record<string, string>;
    deletedBrand: string;
    audit: string;
    auditEmpty: string;
  };
};

const en: Copy = {
  intro: "Codes lower a brand's monthly price at checkout. Each is made by the server; a batch shares its settings.",
  generate: "Generate codes",
  statuses: { active: "Active", used_up: "Used up", expired: "Expired", disabled: "Disabled" },
  filters: { batch: "Batch", allBatches: "All batches", status: "Status", allStatuses: "All statuses", batchName: (id) => `Batch ${id}` },
  table: {
    label: "Promo codes",
    itemLabel: "codes",
    code: "Code",
    discount: "Discount",
    uses: "Uses",
    batch: "Batch",
    expires: "Expires",
    status: "Status",
    created: "Created",
    never: "No expiry",
  },
  uses: (used, max) => (max === null ? `${used} of no limit` : `${used} of ${max}`),
  reserved: (n) => `(${n} reserved)`,
  discount: {
    percent: (n) => `${n}% off`,
    amount: (a) => `${a} off`,
    duration: (d, months) =>
      d === "once" ? "the first month" : d === "forever" ? "forever" : `for ${plural("en", months ?? 0, { one: "{n} month", other: "{n} months" })}`,
    join: (off, when) => `${off} ${when}`,
  },
  actions: { open: "Open code", copy: "Copy code", disable: "Disable code", disableBatch: "Disable batch", rowActions: (code) => `${code} actions` },
  copied: "Code copied",
  copiedAll: "Codes copied",
  copyFailed: "Couldn't copy. Select the code and copy it by hand.",
  empty: {
    noneTitle: "No codes yet",
    noneBody: "Generate a batch to give people a lower price at checkout.",
    noMatchTitle: "No codes match these filters.",
    noMatchBody: "Try another batch or status.",
    clear: "Clear filters",
  },
  form: {
    title: "Generate codes",
    description: "The server makes the codes. Every code in the batch shares these settings.",
    submit: "Generate",
    failed: "Couldn't generate the codes. Try again.",
    count: "How many codes",
    countHint: "1 to 500. One per person you give a code to.",
    usesPerCode: "Uses per code",
    usesHint: "Leave empty for no limit.",
    kind: "Discount type",
    percent: "Percent off",
    amount: "Amount off",
    percentOff: "Percent off",
    percentHint: "1 to 99. For 100%, comp the brand instead.",
    amountOff: "Amount off a month",
    amountHint: "Every plan keeps at least USD 1 a month.",
    duration: "Duration",
    durations: { once: "Once", repeating: "First months", forever: "Forever" },
    durationHints: {
      once: "The first month only.",
      repeating: "A number of months, then the full price.",
      forever: "For as long as the subscription runs.",
    },
    months: "Months",
    monthsHint: "1 to 24.",
    expires: "Last day to redeem",
    expiresHint: "Leave empty for no expiry. Discounts already running carry on.",
    types: "Account types",
    typesHint: "Leave all unticked for every type.",
    firstPurchase: "First purchase only",
    firstPurchaseOn: "Only accounts that have never paid for a brand.",
    firstPurchaseOff: "Any account, paid before or not.",
    note: "Note",
    noteHint: "Why these codes exist. Kept in the audit log.",
    preview: "What a brand pays",
    previewNone: "Set a discount to see the price.",
    previewLine: (type, first, regular, d, months) =>
      d === "forever"
        ? `${type}: ${first} a month`
        : d === "once" || months === 1
          ? `${type}: ${first} for the first month, then ${regular}`
          : `${type}: ${first} a month for ${plural("en", months, { one: "{n} month", other: "{n} months" })}, then ${regular}`,
    errors: {
      count: "Enter a number from 1 to 500.",
      uses: "Enter 1 or more, or leave it empty.",
      percent: "Enter a percent from 1 to 99.",
      amount: "Enter an amount above zero.",
      belowFloor: (type) => `This leaves ${type} under USD 1 a month. Lower the discount or comp the brand.`,
      months: "Enter 1 to 24 months.",
      expiresPast: "Choose today or a later day.",
      noteRequired: "Add a note.",
      noteTooLong: "Keep the note under 500 characters.",
    },
  },
  result: {
    title: (n) => plural("en", n, { one: "1 code generated", other: "{n} codes generated" }),
    description: "They're in the list too. Send each code to one person.",
    label: "New codes",
    copyAll: (n) => (n === 1 ? "Copy code" : "Copy all"),
    csv: "Download CSV",
    csvFailed: "Couldn't download the CSV. Try again.",
    done: "Done",
    viewBatch: "Show this batch",
  },
  disable: {
    title: (code) => `Disable ${code}?`,
    body: "Nobody can redeem it from now on. Discounts already running carry on.",
    reason: "Reason",
    confirm: "Disable code",
    done: (code) => `${code} disabled`,
    failed: "Couldn't disable the code. Try again.",
  },
  disableBatch: {
    title: "Disable the whole batch?",
    body: "Every unused code in this batch stops working. Discounts already running carry on.",
    reason: "Reason",
    confirm: "Disable batch",
    done: "Batch disabled",
    failed: "Couldn't disable the batch. Try again.",
  },
  detail: {
    back: "Codes",
    breadcrumb: "Breadcrumb",
    notFound: "No such code",
    notFoundBody: "It may have been typed wrong. Go back to the list.",
    loadFailed: "Couldn't load this code.",
    facts: "Settings",
    discount: "Discount",
    uses: "Uses",
    batch: "Batch",
    expires: "Last day to redeem",
    created: "Created",
    firstPurchase: "First purchase only",
    yes: "Yes",
    no: "No",
    types: "Account types",
    allTypes: "All types",
    note: "Note",
    redemptions: "Redemptions",
    redemptionsEmpty: "Nobody has redeemed this code yet.",
    brand: "Brand",
    owner: "Owner",
    date: "Date",
    redemptionStatus: "Status",
    payingNow: "Pays now",
    paysUntil: (d) => `until ${d}`,
    redemptionStatuses: { reserved: "Reserved", active: "Active", ended: "Ended", released: "Released" },
    deletedBrand: "Deleted brand",
    audit: "Audit log",
    auditEmpty: "No admin actions on this code yet.",
  },
};

const ar: Copy = {
  intro: "تخفّض الرموز السعر الشهري للعلامة عند الاشتراك. ينشئ الخادم كل رمز، وتشترك رموز الدفعة الواحدة في إعداداتها.",
  generate: "إنشاء رموز",
  statuses: { active: "نشط", used_up: "مُستنفد", expired: "منتهي الصلاحية", disabled: "موقوف" },
  filters: { batch: "الدفعة", allBatches: "كل الدفعات", status: "الحالة", allStatuses: "كل الحالات", batchName: (id) => `الدفعة ${id}` },
  table: {
    label: "رموز الخصم",
    itemLabel: "رموز",
    code: "الرمز",
    discount: "الخصم",
    uses: "الاستخدام",
    batch: "الدفعة",
    expires: "ينتهي",
    status: "الحالة",
    created: "أُنشئ",
    never: "بلا انتهاء",
  },
  uses: (used, max) => (max === null ? `${used} بلا حد` : `${used} من ${max}`),
  reserved: (n) => `(${n} محجوز)`,
  discount: {
    percent: (n) => `خصم ${n}٪`,
    amount: (a) => `خصم ${a}`,
    duration: (d, months) =>
      d === "once"
        ? "للشهر الأول"
        : d === "forever"
          ? "دائمًا"
          : `لمدة ${plural("ar", months ?? 0, { one: "شهر واحد", two: "شهرين", few: "{n} أشهر", other: "{n} شهرًا" })}`,
    join: (off, when) => `${off} ${when}`,
  },
  actions: { open: "فتح الرمز", copy: "نسخ الرمز", disable: "إيقاف الرمز", disableBatch: "إيقاف الدفعة", rowActions: (code) => `إجراءات ${code}` },
  copied: "نُسخ الرمز",
  copiedAll: "نُسخت الرموز",
  copyFailed: "تعذّر النسخ. حدّد الرمز وانسخه يدويًا.",
  empty: {
    noneTitle: "لا رموز بعد",
    noneBody: "أنشئ دفعة لتمنح سعرًا أقل عند الاشتراك.",
    noMatchTitle: "لا رموز تطابق هذه الفلاتر.",
    noMatchBody: "جرّب دفعة أو حالة أخرى.",
    clear: "مسح الفلاتر",
  },
  form: {
    title: "إنشاء رموز",
    description: "ينشئ الخادم الرموز، وتشترك كل رموز الدفعة في هذه الإعدادات.",
    submit: "إنشاء",
    failed: "تعذّر إنشاء الرموز. حاول مرة أخرى.",
    count: "عدد الرموز",
    countHint: "من 1 إلى 500، رمز لكل شخص تمنحه رمزًا.",
    usesPerCode: "مرات استخدام كل رمز",
    usesHint: "اتركه فارغًا ليكون بلا حد.",
    kind: "نوع الخصم",
    percent: "نسبة مئوية",
    amount: "مبلغ ثابت",
    percentOff: "نسبة الخصم",
    percentHint: "من 1 إلى 99. للخصم الكامل أهدِ العلامة خطة بدلًا من ذلك.",
    amountOff: "الخصم الشهري",
    amountHint: "يبقى في كل خطة دولار أمريكي واحد شهريًا على الأقل.",
    duration: "المدة",
    durations: { once: "مرة واحدة", repeating: "أشهر أولى", forever: "دائمًا" },
    durationHints: {
      once: "الشهر الأول فقط.",
      repeating: "عدد من الأشهر، ثم السعر الكامل.",
      forever: "طوال مدة الاشتراك.",
    },
    months: "الأشهر",
    monthsHint: "من 1 إلى 24.",
    expires: "آخر يوم للاستخدام",
    expiresHint: "اتركه فارغًا ليكون بلا انتهاء. الخصومات السارية تستمر.",
    types: "أنواع الحسابات",
    typesHint: "اترك الكل دون تحديد ليشمل كل الأنواع.",
    firstPurchase: "للاشتراك الأول فقط",
    firstPurchaseOn: "للحسابات التي لم تدفع لأي علامة من قبل.",
    firstPurchaseOff: "لأي حساب، دفع من قبل أم لا.",
    note: "ملاحظة",
    noteHint: "سبب إنشاء هذه الرموز، وتُحفظ في سجل التدقيق.",
    preview: "ما تدفعه العلامة",
    previewNone: "حدّد الخصم لترى السعر.",
    previewLine: (type, first, regular, d, months) =>
      d === "forever"
        ? `${type}: ${first} شهريًا`
        : d === "once" || months === 1
          ? `${type}: ${first} للشهر الأول، ثم ${regular}`
          : `${type}: ${first} شهريًا لمدة ${plural("ar", months, { two: "شهرين", few: "{n} أشهر", other: "{n} شهرًا" })}، ثم ${regular}`,
    errors: {
      count: "أدخل عددًا من 1 إلى 500.",
      uses: "أدخل 1 أو أكثر، أو اتركه فارغًا.",
      percent: "أدخل نسبة من 1 إلى 99.",
      amount: "أدخل مبلغًا أكبر من صفر.",
      belowFloor: (type) => `يجعل هذا سعر ${type} أقل من دولار واحد شهريًا. خفّض الخصم أو أهدِ العلامة خطة.`,
      months: "أدخل من 1 إلى 24 شهرًا.",
      expiresPast: "اختر اليوم أو يومًا لاحقًا.",
      noteRequired: "أضف ملاحظة.",
      noteTooLong: "اجعل الملاحظة أقل من 500 حرف.",
    },
  },
  result: {
    title: (n) => plural("ar", n, { one: "أُنشئ رمز واحد", two: "أُنشئ رمزان", few: "أُنشئت {n} رموز", other: "أُنشئ {n} رمزًا" }),
    description: "تجدها في القائمة أيضًا. أرسل كل رمز إلى شخص واحد.",
    label: "الرموز الجديدة",
    copyAll: (n) => (n === 1 ? "نسخ الرمز" : "نسخ الكل"),
    csv: "تنزيل CSV",
    csvFailed: "تعذّر تنزيل ملف CSV. حاول مرة أخرى.",
    done: "تم",
    viewBatch: "عرض هذه الدفعة",
  },
  disable: {
    title: (code) => `إيقاف ${code}؟`,
    body: "لن يتمكن أحد من استخدامه بعد الآن، وتستمر الخصومات السارية.",
    reason: "السبب",
    confirm: "إيقاف الرمز",
    done: (code) => `أُوقف ${code}`,
    failed: "تعذّر إيقاف الرمز. حاول مرة أخرى.",
  },
  disableBatch: {
    title: "إيقاف الدفعة كاملة؟",
    body: "تتوقف كل الرموز غير المستخدمة في هذه الدفعة، وتستمر الخصومات السارية.",
    reason: "السبب",
    confirm: "إيقاف الدفعة",
    done: "أُوقفت الدفعة",
    failed: "تعذّر إيقاف الدفعة. حاول مرة أخرى.",
  },
  detail: {
    back: "الرموز",
    breadcrumb: "مسار التنقل",
    notFound: "لا يوجد رمز كهذا",
    notFoundBody: "ربما كُتب خطأً. عد إلى القائمة.",
    loadFailed: "تعذّر تحميل هذا الرمز.",
    facts: "الإعدادات",
    discount: "الخصم",
    uses: "الاستخدام",
    batch: "الدفعة",
    expires: "آخر يوم للاستخدام",
    created: "أُنشئ",
    firstPurchase: "للاشتراك الأول فقط",
    yes: "نعم",
    no: "لا",
    types: "أنواع الحسابات",
    allTypes: "كل الأنواع",
    note: "ملاحظة",
    redemptions: "مرات الاستخدام",
    redemptionsEmpty: "لم يستخدم أحد هذا الرمز بعد.",
    brand: "العلامة",
    owner: "المالك",
    date: "التاريخ",
    redemptionStatus: "الحالة",
    payingNow: "يدفع الآن",
    paysUntil: (d) => `حتى ${d}`,
    redemptionStatuses: { reserved: "محجوز", active: "نشط", ended: "منتهٍ", released: "مُحرَّر" },
    deletedBrand: "علامة محذوفة",
    audit: "سجل التدقيق",
    auditEmpty: "لا إجراءات إدارية على هذا الرمز بعد.",
  },
};

export const ADMIN_PROMO_COPY = { en, ar } as const;
export type AdminPromoCopy = Copy;
