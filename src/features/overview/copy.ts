import type { PathStepKey } from "@/types";
import type { ActivityType, AttentionType, MainActionKey } from "./types";

/*
 * Overview words (redesign, 22 Nov 2026), as keys in both languages:
 * screen.element.state. The Arabic is a draft to align with «دليل نصوص
 * الواجهة» when it lands (docs/development/UX_INITIATIVE_REPORT.md, Phase 6).
 * Company copy never says «عميل», «استوديو» or «وكالة»: a company runs its
 * own brand, with its team and partners.
 */

type Copy = {
  page: { title: string; project: string; brandHome: string };
  demo: { title: string; body: string };
  stage: Record<PathStepKey | "complete", string>;
  steps: Record<PathStepKey, string>;
  stepState: { done: string; in_progress: string; skipped: string; not_started: string };
  path: { label: string; current: string; skip: string; unskip: string; open: string; stepActions: (step: string) => string };
  action: Record<MainActionKey, string>;
  handoff: { title: string; body: string; confirm: string; done: string };
  header: { share: string; invite: string; openHub: string; published: string; notPublished: string; noTagline: string };
  share: { guideLink: string; copyGuideLink: string; copied: string; notLive: string; access: string };
  attention: {
    title: string;
    empty: string;
    item: Record<AttentionType, (v: { count: number; title: string; by: string }) => string>;
  };
  soFar: {
    title: string;
    glanceTitle: string;
    positioning: string;
    voice: string;
    audience: string;
    colors: string;
    logos: string;
    typefaces: string;
    personas: (n: number) => string;
    empty: { positioning: string; voice: string; audience: string; colors: string; logos: string; typefaces: string };
    goTo: { strategy: string; identity: string };
    copyHex: (hex: string) => string;
    copiedHex: (hex: string) => string;
    latin: string;
    arabic: string;
  };
  quick: {
    title: string;
    check: { label: string; description: string };
    logo: { label: string; description: string };
    share: { label: string; description: string };
  };
  side: {
    contact: string;
    contactFromForm: string;
    team: string;
    people: string;
    links: string;
    linkActions: (label: string) => string;
    copyLink: string;
    linkCopied: string;
    linkScope: { strategy: string; department: string };
    activity: string;
    role: Record<"owner" | "editor" | "viewer" | "client", string>;
  };
  activity: Record<ActivityType, (v: { title: string; by: string }) => string>;
  error: { block: string; retry: string; page: string };
};

const en: Copy = {
  page: { title: "Overview", project: "Project overview", brandHome: "Brand home" },
  demo: { title: "Demo brand", body: "Sample content to explore Markyos. Changes here don't affect your own brands." },
  stage: {
    discover: "Discover", analyse: "Analyse", strategy: "Strategy", direction: "Direction",
    identity: "Identity", kit: "Brand kit", guide: "Guide", handoff: "Handoff", complete: "Handed off",
  },
  steps: {
    discover: "Discover", analyse: "Analyse", strategy: "Strategy", direction: "Direction",
    identity: "Identity", kit: "Brand kit", guide: "Guide", handoff: "Handoff",
  },
  stepState: { done: "Done", in_progress: "In progress", skipped: "Skipped", not_started: "Not started" },
  path: {
    label: "Project path",
    current: "Current step",
    skip: "Skip this step",
    unskip: "Don't skip",
    open: "Open",
    stepActions: (step) => `${step} actions`,
  },
  action: {
    send_form: "Send discovery form",
    read_answers: "Read the answers",
    review_drafts: "Review drafts",
    run_analysis: "Analyse the answers",
    write_strategy: "Write the strategy",
    build_guide: "Build the guide",
    hand_off: "Hand off",
    open_guide: "Open the guide",
  },
  handoff: {
    title: "Hand off this project?",
    body: "The project is marked as handed off today. The guideline and its links keep working.",
    confirm: "Hand off",
    done: "Project handed off.",
  },
  header: {
    share: "Share with client",
    invite: "Invite people",
    openHub: "Open the hub",
    published: "Published",
    notPublished: "Not published",
    noTagline: "",
  },
  share: {
    guideLink: "Guideline link",
    copyGuideLink: "Copy the guideline link",
    copied: "Link copied.",
    notLive: "The guideline isn't live yet. Publish it to share its link.",
    access: "Client access settings",
  },
  attention: {
    title: "Needs your attention",
    empty: "Nothing is waiting on you.",
    item: {
      form_answered: ({ title }) => `“${title}” was answered`,
      drafts_waiting: ({ count }) => (count === 1 ? "1 draft waiting for review" : `${count} drafts waiting for review`),
      signoff_pending: ({ count }) => (count === 1 ? "1 sign-off note to resolve" : `${count} sign-off notes to resolve`),
      approval_waiting: ({ title, by }) => (by ? `${by} proposed: ${title}` : `Proposal: ${title}`),
      link_expiring: () => "An analysis share link expires soon",
    },
  },
  soFar: {
    title: "The brand so far",
    glanceTitle: "Brand at a glance",
    positioning: "Positioning",
    voice: "Voice",
    audience: "Audience",
    colors: "Colours",
    logos: "Logos",
    typefaces: "Typefaces",
    personas: (n) => (n === 1 ? "1 persona" : `${n} personas`),
    empty: {
      positioning: "Shows here once the positioning is written in Strategy.",
      voice: "Shows here once voice traits are added in Strategy.",
      audience: "Shows here once the audience is described in Strategy.",
      colors: "Shows here once brand colours are added in Visual identity.",
      logos: "Shows here once a logo is added in Visual identity.",
      typefaces: "Shows here once typefaces are chosen in Visual identity.",
    },
    goTo: { strategy: "Go to Strategy", identity: "Go to Visual identity" },
    copyHex: (hex) => `Copy ${hex}`,
    copiedHex: (hex) => `${hex} copied.`,
    latin: "Latin",
    arabic: "Arabic",
  },
  quick: {
    title: "Quick actions",
    check: { label: "Check content", description: "Check copy against the brand's voice" },
    logo: { label: "Download the logo", description: "Logo files in every version" },
    share: { label: "Share with a partner", description: "Access to the guideline for partners" },
  },
  side: {
    contact: "Client contact",
    contactFromForm: "From the discovery form",
    team: "Team",
    people: "People",
    links: "Shared links",
    linkActions: (label) => `${label} actions`,
    copyLink: "Copy link",
    linkCopied: "Link copied.",
    linkScope: { strategy: "Strategy", department: "Department" },
    activity: "Recent activity",
    role: { owner: "Owner", editor: "Editor", viewer: "Viewer", client: "Client" },
  },
  activity: {
    form_sent: ({ title, by }) => (by ? `Discovery form “${title}” sent to ${by}` : `Discovery form “${title}” sent`),
    form_answered: ({ title }) => `Discovery form “${title}” answered`,
    analysis_ready: () => "Brief analysis ready",
    draft_proposed: () => "Draft proposed",
    draft_accepted: () => "Draft accepted",
    draft_rejected: () => "Draft rejected",
    signoff_note: ({ by }) => (by ? `${by} left a sign-off note` : "Sign-off note left"),
    signoff_resolved: () => "Sign-off note resolved",
    approval_proposed: ({ title, by }) => (by ? `${by} proposed: ${title}` : `Proposed: ${title}`),
    approval_approved: ({ title }) => `Approved: ${title}`,
    approval_rejected: ({ title }) => `Declined: ${title}`,
    call_note: ({ title }) => `Call note: ${title}`,
    link_created: ({ title }) => (title ? `Share link created: ${title}` : "Share link created"),
    link_revoked: ({ title }) => (title ? `Share link revoked: ${title}` : "Share link revoked"),
    version_saved: ({ title }) => (title ? `Version saved: ${title}` : "Version saved"),
    published: () => "Guideline published",
    direction_chosen: () => "Direction chosen",
    handed_off: () => "Project handed off",
  },
  error: { block: "This part couldn't load.", retry: "Try again", page: "The overview couldn't load." },
};

const ar: Copy = {
  page: { title: "نظرة عامة", project: "نظرة على المشروع", brandHome: "الصفحة الرئيسية للعلامة" },
  demo: { title: "علامة تجريبية", body: "محتوى تجريبي لاستكشاف ماركيوس. التغييرات هنا لا تمس علاماتك." },
  stage: {
    discover: "الاكتشاف", analyse: "التحليل", strategy: "الاستراتيجية", direction: "الاتجاه",
    identity: "الهوية", kit: "ملفات العلامة", guide: "الدليل", handoff: "التسليم", complete: "تم التسليم",
  },
  steps: {
    discover: "الاكتشاف", analyse: "التحليل", strategy: "الاستراتيجية", direction: "الاتجاه",
    identity: "الهوية", kit: "ملفات العلامة", guide: "الدليل", handoff: "التسليم",
  },
  stepState: { done: "مكتملة", in_progress: "قيد العمل", skipped: "تم تخطيها", not_started: "لم تبدأ" },
  path: {
    label: "مسار المشروع",
    current: "الخطوة الحالية",
    skip: "تخطي هذه الخطوة",
    unskip: "إلغاء التخطي",
    open: "فتح",
    stepActions: (step) => `إجراءات ${step}`,
  },
  action: {
    send_form: "إرسال استبيان الاكتشاف",
    read_answers: "قراءة الإجابات",
    review_drafts: "مراجعة المسودات",
    run_analysis: "تحليل الإجابات",
    write_strategy: "كتابة الاستراتيجية",
    build_guide: "بناء الدليل",
    hand_off: "التسليم",
    open_guide: "فتح الدليل",
  },
  handoff: {
    title: "تسليم هذا المشروع؟",
    body: "يُسجَّل المشروع كمُسلَّم اليوم. يبقى الدليل وروابطه تعمل كما هي.",
    confirm: "التسليم",
    done: "تم تسليم المشروع.",
  },
  header: {
    share: "مشاركة مع العميل",
    invite: "دعوة أشخاص",
    openHub: "فتح الدليل",
    published: "منشور",
    notPublished: "غير منشور",
    noTagline: "",
  },
  share: {
    guideLink: "رابط الدليل",
    copyGuideLink: "نسخ رابط الدليل",
    copied: "تم نسخ الرابط.",
    notLive: "الدليل غير منشور بعد. انشره لتتمكن من مشاركة رابطه.",
    access: "إعدادات وصول العميل",
  },
  attention: {
    title: "بانتظارك",
    empty: "لا شيء بانتظارك",
    item: {
      form_answered: ({ title }) => `تمت الإجابة على «${title}»`,
      drafts_waiting: ({ count }) =>
        count === 1 ? "مسودة واحدة بانتظار المراجعة" : count === 2 ? "مسودتان بانتظار المراجعة" : count <= 10 ? `${count} مسودات بانتظار المراجعة` : `${count} مسودة بانتظار المراجعة`,
      signoff_pending: ({ count }) =>
        count === 1 ? "ملاحظة اعتماد واحدة تنتظر الحل" : count === 2 ? "ملاحظتا اعتماد تنتظران الحل" : count <= 10 ? `${count} ملاحظات اعتماد تنتظر الحل` : `${count} ملاحظة اعتماد تنتظر الحل`,
      approval_waiting: ({ title, by }) => (by ? `اقترح ${by}: ${title}` : `اقتراح: ${title}`),
      link_expiring: () => "رابط مشاركة لتحليل ينتهي قريبًا",
    },
  },
  soFar: {
    title: "العلامة حتى الآن",
    glanceTitle: "العلامة بلمحة",
    positioning: "التموضع",
    voice: "النبرة",
    audience: "الجمهور",
    colors: "الألوان",
    logos: "الشعارات",
    typefaces: "الخطوط",
    personas: (n) => (n === 1 ? "شخصية واحدة" : n === 2 ? "شخصيتان" : n <= 10 ? `${n} شخصيات` : `${n} شخصية`),
    empty: {
      positioning: "يظهر هنا بعد كتابة التموضع في الاستراتيجية.",
      voice: "تظهر هنا بعد إضافة سمات النبرة في الاستراتيجية.",
      audience: "يظهر هنا بعد وصف الجمهور في الاستراتيجية.",
      colors: "تظهر هنا بعد إضافة ألوان الهوية.",
      logos: "تظهر هنا بعد إضافة شعار في الهوية البصرية.",
      typefaces: "تظهر هنا بعد اختيار الخطوط في الهوية البصرية.",
    },
    goTo: { strategy: "الذهاب إلى الاستراتيجية", identity: "الذهاب إلى الهوية البصرية" },
    copyHex: (hex) => `نسخ ${hex}`,
    copiedHex: (hex) => `تم نسخ ${hex}.`,
    latin: "اللاتيني",
    arabic: "العربي",
  },
  quick: {
    title: "إجراءات سريعة",
    check: { label: "فحص المحتوى", description: "طابق النص مع نبرة العلامة" },
    logo: { label: "تنزيل الشعار", description: "ملفات الشعار بكل نسخها" },
    share: { label: "المشاركة مع شريك", description: "وصول الشركاء إلى الدليل" },
  },
  side: {
    contact: "جهة التواصل لدى العميل",
    contactFromForm: "من استبيان الاكتشاف",
    team: "الفريق",
    people: "الأشخاص",
    links: "الروابط المشتركة",
    linkActions: (label) => `إجراءات ${label}`,
    copyLink: "نسخ الرابط",
    linkCopied: "تم نسخ الرابط.",
    linkScope: { strategy: "الاستراتيجية", department: "قسم" },
    activity: "آخر النشاط",
    role: { owner: "المالك", editor: "محرر", viewer: "مشاهد", client: "عميل" },
  },
  activity: {
    form_sent: ({ title, by }) => (by ? `أُرسل استبيان «${title}» إلى ${by}` : `أُرسل استبيان «${title}»`),
    form_answered: ({ title }) => `تمت الإجابة على استبيان «${title}»`,
    analysis_ready: () => "التحليل جاهز",
    draft_proposed: () => "اقتُرحت مسودة",
    draft_accepted: () => "قُبلت مسودة",
    draft_rejected: () => "رُفضت مسودة",
    signoff_note: ({ by }) => (by ? `ترك ${by} ملاحظة اعتماد` : "أُضيفت ملاحظة اعتماد"),
    signoff_resolved: () => "حُلّت ملاحظة اعتماد",
    approval_proposed: ({ title, by }) => (by ? `اقترح ${by}: ${title}` : `اقتراح: ${title}`),
    approval_approved: ({ title }) => `اعتُمد: ${title}`,
    approval_rejected: ({ title }) => `رُفض: ${title}`,
    call_note: ({ title }) => `ملاحظة مكالمة: ${title}`,
    link_created: ({ title }) => (title ? `أُنشئ رابط مشاركة: ${title}` : "أُنشئ رابط مشاركة"),
    link_revoked: ({ title }) => (title ? `أُلغي رابط مشاركة: ${title}` : "أُلغي رابط مشاركة"),
    version_saved: ({ title }) => (title ? `حُفظت نسخة: ${title}` : "حُفظت نسخة"),
    published: () => "نُشر الدليل",
    direction_chosen: () => "اختير الاتجاه",
    handed_off: () => "تم تسليم المشروع",
  },
  error: { block: "تعذّر تحميل هذا الجزء.", retry: "إعادة المحاولة", page: "تعذّر تحميل النظرة العامة." },
};

/** The company's own words: its team and partners, never a client or a studio. */
const companyEn: Partial<Copy["side"]> & { share: Copy["share"]; attentionSignoff: Copy["attention"]["item"]["signoff_pending"] } = {
  contact: "Contact",
  role: { owner: "Owner", editor: "Editor", viewer: "Viewer", client: "External reviewer" },
  share: { ...en.share, access: "Team and partner access" },
  attentionSignoff: ({ count }) => (count === 1 ? "1 review note to resolve" : `${count} review notes to resolve`),
};
const companyAr: typeof companyEn = {
  contact: "جهة التواصل",
  role: { owner: "المالك", editor: "محرر", viewer: "مشاهد", client: "مراجع خارجي" },
  share: { ...ar.share, notLive: "الدليل غير منشور بعد. انشره لتتمكن من مشاركة رابطه.", access: "وصول الفريق والشركاء" },
  attentionSignoff: ({ count }) =>
    count === 1 ? "ملاحظة مراجعة واحدة تنتظر الحل" : count === 2 ? "ملاحظتا مراجعة تنتظران الحل" : count <= 10 ? `${count} ملاحظات مراجعة تنتظر الحل` : `${count} ملاحظة مراجعة تنتظر الحل`,
};

/** The Overview's words for the reader's language and the brand's owner type. */
export function overviewCopy(isAr: boolean, company = false): Copy {
  const base = isAr ? ar : en;
  if (!company) return base;
  const c = isAr ? companyAr : companyEn;
  return {
    ...base,
    share: c.share,
    side: { ...base.side, contact: c.contact!, role: c.role! },
    attention: { ...base.attention, item: { ...base.attention.item, signoff_pending: c.attentionSignoff } },
  };
}

export type OverviewCopy = Copy;
