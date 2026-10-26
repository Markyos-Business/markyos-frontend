import { DESIGN_SYSTEMS } from "@/components/features/guideline-site";
import type { AssetType, GuidelineTemplate, PageBlock, StudioStyle } from "@/types";
import { uid } from "@/lib/utils";

/** The one-click starter sections each guideline template offers, and how the templates are described. */

export interface Template {
  key: string;
  label: string;
  arLabel: string;
  icon: string;
  hint: string;
  arHint: string;
  blocks: Omit<PageBlock, "id" | "order">[];
  /** A full multi-section landing page rather than one isolated combo — gets a highlighted row. */
  featured?: boolean;
}

const CASE_STUDY: Template = {
  key: "case-study",
  label: "Case study spotlight",
  arLabel: "عرض دراسة حالة",
  icon: "id-badge",
  hint: "Image, story, client quote.",
  arHint: "صورة، قصة، واقتباس عميل.",
  blocks: [
    { kind: "image" },
    { kind: "text", title: "The story", arTitle: "القصة", text: "Write a short paragraph about this project.", arText: "اكتب فقرة قصيرة عن هذا المشروع." },
    { kind: "quote", text: "A client quote goes here.", arText: "اقتباس العميل هنا.", attribution: "Client name" },
  ],
};

const STATS_ROW: Template = {
  key: "stats",
  label: "Stats row",
  arLabel: "صف الإحصاءات",
  icon: "chart-line",
  hint: "Three editable numbers.",
  arHint: "ثلاثة أرقام قابلة للتعديل.",
  blocks: [
    { kind: "stat", title: "10+", arTitle: "+10", text: "Years in business", arText: "سنوات في العمل" },
    { kind: "stat", title: "120", arTitle: "120", text: "Brands delivered", arText: "هوية تم تسليمها" },
    { kind: "stat", title: "98%", arTitle: "٩٨٪", text: "Client satisfaction", arText: "رضا العملاء" },
  ],
};

const CTA_BANNER: Template = {
  key: "cta-banner",
  label: "CTA banner",
  arLabel: "بانر دعوة لإجراء",
  icon: "link",
  hint: "A bold statement with one button.",
  arHint: "عبارة قوية مع زر واحد.",
  blocks: [
    { kind: "text", title: "Need something custom?", arTitle: "تحتاج شيئًا مخصصًا؟", text: "Reach out and the studio will put it together.", arText: "تواصل معنا وسيقوم الاستوديو بإعداده." },
    { kind: "button", title: "Contact the studio", arTitle: "تواصل مع الاستوديو", linkUrl: "" },
  ],
};

const VOICE_DO_DONT: Template = {
  key: "voice-do-dont",
  label: "Voice: do & don't",
  arLabel: "الصوت: افعل ولا تفعل",
  icon: "quote-right",
  hint: "Two side-by-side examples of on-brand vs. off-brand copy.",
  arHint: "مثالان جنبًا إلى جنب لنص متوافق مع الهوية وآخر غير متوافق.",
  blocks: [
    { kind: "text", title: "Voice in practice", arTitle: "الصوت في الممارسة", text: "How the brand actually sounds, compared to how it doesn't.", arText: "كيف تبدو الهوية فعليًا، مقارنة بما لا ينبغي أن تبدو عليه." },
    { kind: "quote", text: "Write the on-brand version of a real sentence here.", arText: "اكتب هنا النسخة المتوافقة مع الهوية لجملة حقيقية.", attribution: "Do this" },
    { kind: "quote", text: "Write the off-brand version of the same sentence here.", arText: "اكتب هنا النسخة غير المتوافقة لنفس الجملة.", attribution: "Not this" },
  ],
};

const FAQ_SECTION: Template = {
  key: "faq",
  label: "FAQ section",
  arLabel: "الأسئلة الشائعة",
  icon: "question-circle",
  hint: "Heading with 3 questions.",
  arHint: "عنوان مع 3 أسئلة.",
  blocks: [
    { kind: "text", title: "Frequently asked questions", arTitle: "الأسئلة الشائعة" },
    { kind: "faq", title: "Can we use the logo on a colored background?", arTitle: "هل يمكن استخدام الشعار على خلفية ملونة؟", text: "Only on the approved palette — see the Color section.", arText: "فقط على الألوان المعتمدة — راجع قسم الألوان." },
    { kind: "faq", title: "Where do we get the source files?", arTitle: "من أين نحصل على الملفات المصدر؟", text: "Download them from the button at the top of this page.", arText: "حمّلها من زر التحميل أعلى هذه الصفحة." },
    { kind: "faq", title: "Who approves changes to the guideline?", arTitle: "من يعتمد التغييرات على الدليل؟", text: "Reach out to the studio — see the contact section.", arText: "تواصل مع الاستوديو — راجع قسم التواصل." },
  ],
};

const CONTACT_SECTION: Template = {
  key: "contact",
  label: "Contact section",
  arLabel: "قسم التواصل",
  icon: "envelope",
  hint: "Heading, form, social links.",
  arHint: "عنوان، نموذج، روابط اجتماعية.",
  blocks: [
    { kind: "text", title: "Get in touch", arTitle: "تواصل معنا", text: "Questions about the brand? Reach out any time.", arText: "لديك أسئلة عن الهوية؟ تواصل معنا في أي وقت." },
    { kind: "form", title: "Send a message", arTitle: "أرسل رسالة", text: "We'll get back to you within a day.", arText: "سنرد عليك خلال يوم واحد.", linkUrl: "" },
    { kind: "socialLinks", socialLinks: [{ id: uid(), platform: "Instagram", url: "" }, { id: uid(), platform: "LinkedIn", url: "" }] },
  ],
};

const RESOURCES: Template = {
  key: "resources",
  label: "Resource downloads",
  arLabel: "ملفات للتحميل",
  icon: "download",
  hint: "Heading, gallery, and a download link.",
  arHint: "عنوان، معرض صور، ورابط تحميل.",
  blocks: [
    { kind: "text", title: "Additional resources", arTitle: "موارد إضافية", text: "Everything you need beyond the core guideline.", arText: "كل ما تحتاجه بعد الدليل الأساسي." },
    { kind: "gallery" },
    { kind: "button", title: "View all assets", arTitle: "عرض كل الأصول", linkUrl: "" },
  ],
};

const MISSION_VALUES: Template = {
  key: "mission-values",
  label: "Mission & values",
  arLabel: "الرسالة والقيم",
  icon: "book",
  hint: "Heading plus three short value statements.",
  arHint: "عنوان مع ثلاث قيم مختصرة.",
  blocks: [
    { kind: "text", title: "Mission", arTitle: "الرسالة", text: "Write the studio or brand's mission statement here.", arText: "اكتب هنا رسالة الاستوديو أو الهوية." },
    { kind: "text", title: "Brand idea", arTitle: "فكرة الهوية", text: "The single idea everything else is built on.", arText: "الفكرة الواحدة التي يُبنى عليها كل شيء آخر." },
    { kind: "text", title: "Our values", arTitle: "قيمنا", text: "The three or four principles that guide decisions.", arText: "المبادئ الثلاثة أو الأربعة التي توجّه القرارات." },
  ],
};

const VIDEO_SHOWCASE: Template = {
  key: "video",
  label: "Video showcase",
  arLabel: "عرض فيديو",
  icon: "play",
  hint: "Heading with a video embed.",
  arHint: "عنوان مع فيديو مضمّن.",
  blocks: [
    { kind: "text", title: "See it in motion", arTitle: "شاهدها في الحركة" },
    { kind: "video" },
  ],
};

const GALLERY_SHOWCASE: Template = {
  key: "gallery-showcase",
  label: "Gallery showcase",
  arLabel: "عرض معرض الصور",
  icon: "shapes",
  hint: "A big, poster-style image grid.",
  arHint: "شبكة صور كبيرة بأسلوب بوستر.",
  blocks: [
    { kind: "text", title: "Selected work", arTitle: "أعمال مختارة" },
    { kind: "gallery" },
  ],
};

const BIG_NUMBER_CTA: Template = {
  key: "big-number-cta",
  label: "Big number + CTA",
  arLabel: "رقم كبير مع دعوة لإجراء",
  icon: "chart-line",
  hint: "One bold stat leading into a button.",
  arHint: "إحصائية واحدة قوية تليها زر.",
  blocks: [
    { kind: "stat", title: "100+", arTitle: "+100", text: "Brands trust this system", arText: "هوية تثق بهذا النظام" },
    { kind: "button", title: "Explore the full guideline", arTitle: "استكشف الدليل الكامل", linkUrl: "" },
  ],
};

/** Stitches several combos into one full landing-page-style insert — the
 *  same shape as a real marketing landing page (intro, proof, story, CTA)
 *  rather than one isolated section. Still just normal customBlocks once
 *  inserted: every piece stays individually editable or deletable. */
function fullPage(key: string, label: string, arLabel: string, hint: string, arHint: string, parts: Template[]): Template {
  return { key, label, arLabel, icon: "layer-group", hint, arHint, blocks: parts.flatMap((p) => p.blocks), featured: true };
}

// Each guideline-site style gets its own curated set of one-click prebuilt
// sections, matching the tone of that layout — a bold dark scroller (Vault,
// after Vaultx's brand-deck structure) wants a CTA banner and voice
// callouts, a reference doc site (Docs, after Cipherly's sectioned
// microsite) wants mission/FAQ/resources, a poster-style site (Studio,
// after BrandKit's numbered showcase pages) wants big visual showcases.
// Each style also gets one "full landing page" entry that stitches its own
// combos into a single complete page, matching the full multi-section flow
// of those reference sites in one click. Every block a template inserts is
// a normal customBlocks entry afterward — deletable and editable exactly
// like anything added from the Elements palette.
export const TEMPLATE_SETS: Record<GuidelineTemplate, Template[]> = {
  vault: [
    fullPage(
      "vault-full-page",
      "Full landing page",
      "صفحة هبوط كاملة",
      "Intro, stats, case study, voice guide, and a closing CTA — in one insert.",
      "مقدمة، إحصاءات، دراسة حالة، دليل الصوت، ودعوة ختامية — في إضافة واحدة.",
      [STATS_ROW, CASE_STUDY, VOICE_DO_DONT, CTA_BANNER]
    ),
    CASE_STUDY,
    STATS_ROW,
    CTA_BANNER,
    VOICE_DO_DONT,
  ],
  docs: [
    fullPage(
      "docs-full-page",
      "Full landing page",
      "صفحة هبوط كاملة",
      "Mission, FAQ, resources, and a contact section — in one insert.",
      "الرسالة، الأسئلة الشائعة، الموارد، وقسم التواصل — في إضافة واحدة.",
      [MISSION_VALUES, FAQ_SECTION, RESOURCES, CONTACT_SECTION]
    ),
    FAQ_SECTION,
    CONTACT_SECTION,
    RESOURCES,
    MISSION_VALUES,
  ],
  studio: [
    fullPage(
      "studio-full-page",
      "Full landing page",
      "صفحة هبوط كاملة",
      "Case study, video, gallery, and a closing number — in one insert.",
      "دراسة حالة، فيديو، معرض صور، ورقم ختامي — في إضافة واحدة.",
      [CASE_STUDY, VIDEO_SHOWCASE, GALLERY_SHOWCASE, BIG_NUMBER_CTA]
    ),
    CASE_STUDY,
    VIDEO_SHOWCASE,
    GALLERY_SHOWCASE,
    BIG_NUMBER_CTA,
  ],
  // Manual presents each insert as a page of the book, so its combos are the
  // ones a printed brand manual actually carries.
  manual: [
    fullPage(
      "manual-full-page",
      "Full chapter",
      "فصل كامل",
      "Mission and values, a case study, and a closing statement — in one insert.",
      "الرسالة والقيم، دراسة حالة، وعبارة ختامية — في إضافة واحدة.",
      [MISSION_VALUES, CASE_STUDY, CTA_BANNER]
    ),
    MISSION_VALUES,
    CASE_STUDY,
    VOICE_DO_DONT,
    RESOURCES,
  ],
  // Mosaic lays sections into a grid, so its combos are the ones that read as
  // tiles — a stat row, a gallery, a closing banner — rather than long prose.
  mosaic: [
    fullPage(
      "mosaic-full-page",
      "Full hub",
      "لوحة كاملة",
      "Stats, a gallery, a case study, and a closing CTA — in one insert.",
      "إحصاءات، معرض صور، دراسة حالة، ودعوة ختامية — في إضافة واحدة.",
      [STATS_ROW, GALLERY_SHOWCASE, CASE_STUDY, CTA_BANNER]
    ),
    STATS_ROW,
    GALLERY_SHOWCASE,
    CTA_BANNER,
    CASE_STUDY,
  ],
  // In Deck every block becomes a slide of its own, so these are described in
  // slides rather than sections — a three-block combo adds three slides, and
  // saying "one section" would be misleading here.
  deck: [
    fullPage(
      "deck-chapter",
      "Story chapter",
      "فصل سردي",
      "Adds 3 slides: mission, brand idea, values.",
      "يضيف 3 شرائح: الرسالة، فكرة الهوية، القيم.",
      [MISSION_VALUES]
    ),
    { ...CASE_STUDY, hint: "Adds 3 slides: image, story, client quote.", arHint: "يضيف 3 شرائح: صورة، قصة، اقتباس عميل." },
    { ...STATS_ROW, hint: "Adds 3 slides, one number each.", arHint: "يضيف 3 شرائح، رقم في كل منها." },
    { ...GALLERY_SHOWCASE, hint: "Adds 2 slides: a title and an image grid.", arHint: "يضيف شريحتين: عنوان وشبكة صور." },
    { ...VIDEO_SHOWCASE, hint: "Adds 2 slides: a title and a video.", arHint: "يضيف شريحتين: عنوان وفيديو." },
  ],
};

/**
 * The descriptions come from the design systems themselves rather than being
 * written twice. Each template is now its own system — its own ground, corner
 * language, card treatment and type scale — so a picker that described only
 * where the nav sits would be describing the smallest of the differences.
 */
export const STYLE_META: Record<GuidelineTemplate, { name: string; arName: string; description: string; arDescription: string }> = {
  vault: {
    name: DESIGN_SYSTEMS.vault.name,
    arName: DESIGN_SYSTEMS.vault.arName,
    description: DESIGN_SYSTEMS.vault.note,
    arDescription: DESIGN_SYSTEMS.vault.arNote,
  },
  docs: {
    name: DESIGN_SYSTEMS.docs.name,
    arName: DESIGN_SYSTEMS.docs.arName,
    description: DESIGN_SYSTEMS.docs.note,
    arDescription: DESIGN_SYSTEMS.docs.arNote,
  },
  studio: {
    name: "Studio",
    arName: "Studio",
    description: "Three separate design systems to choose between.",
    arDescription: "ثلاثة أنظمة تصميم منفصلة للاختيار من بينها.",
  },
  manual: {
    name: DESIGN_SYSTEMS.manual.name,
    arName: DESIGN_SYSTEMS.manual.arName,
    description: DESIGN_SYSTEMS.manual.note,
    arDescription: DESIGN_SYSTEMS.manual.arNote,
  },
  mosaic: {
    name: DESIGN_SYSTEMS.mosaic.name,
    arName: DESIGN_SYSTEMS.mosaic.arName,
    description: DESIGN_SYSTEMS.mosaic.note,
    arDescription: DESIGN_SYSTEMS.mosaic.arNote,
  },
  deck: {
    name: DESIGN_SYSTEMS.deck.name,
    arName: DESIGN_SYSTEMS.deck.arName,
    description: `${DESIGN_SYSTEMS.deck.note} 1920×1080 slides, not a scrolling site.`,
    arDescription: `${DESIGN_SYSTEMS.deck.arNote} شرائح 1920×1080، وليس موقعًا قابلًا للتمرير.`,
  },
};

// The Studio style offers 3 fully distinct professional sub-styles, each
// modeled on a different real brand-guideline microsite's own navigation
// pattern (see Workspace.studioStyle and the studio/ template folder).
export const STUDIO_STYLE_META: Record<StudioStyle, { name: string; arName: string; description: string; arDescription: string }> = {
  signal: {
    name: DESIGN_SYSTEMS.signal.name,
    arName: DESIGN_SYSTEMS.signal.arName,
    description: DESIGN_SYSTEMS.signal.note,
    arDescription: DESIGN_SYSTEMS.signal.arNote,
  },
  atlas: {
    name: DESIGN_SYSTEMS.atlas.name,
    arName: DESIGN_SYSTEMS.atlas.arName,
    description: DESIGN_SYSTEMS.atlas.note,
    arDescription: DESIGN_SYSTEMS.atlas.arNote,
  },
  prism: {
    name: DESIGN_SYSTEMS.prism.name,
    arName: DESIGN_SYSTEMS.prism.arName,
    description: DESIGN_SYSTEMS.prism.note,
    arDescription: DESIGN_SYSTEMS.prism.arNote,
  },
};

export const FILE_ASSET_TYPES: AssetType[] = ["pdf", "font", "mockup", "export"];
