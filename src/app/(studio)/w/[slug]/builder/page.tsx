"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/contexts/AppContext";
import { useToast, useDialog, Icon } from "@/components/ui";
import { EmptyHint } from "@/components/ui/composites/SectionUI/SectionUI";
import {
  ImagePicker,
  SecondaryViewBanner,
  ViewSwitcher,
  CanvasFrame,
  DesignInspector,
  LayersTab,
  ReviewChip,
  reviewPage,
} from "@/components/features/builder";
import {
  TemplatePreviewCard,
  StudioStylePreviewCard,
  ContrastReport,
  LiveCanvas,
  BLOCK_DRAG_TYPE,
  resolveOptions,
  useGuidelineViewer,
  ALL_BLOCK_KINDS,
  BLOCK_META,
  CATEGORY_META,
  CATEGORY_ORDER,
  DESIGN_SYSTEMS,
} from "@/components/features/guideline-site";
import { scopeForView } from "@/lib/doc/core/rules";
import type { Breakpoint, ViewContext } from "@/lib/doc/core/types";
import { useLocalPref } from "@/hooks/useLocalPref";
import { useNarrowViewport } from "@/hooks/useNarrowViewport";
import { AssetType, BlockKind, BlockStyle, GuidelineTemplate, Lang, PageBlock, SocialLink, StudioStyle, Workspace } from "@/types";
import { formatBytes, formatRelative, uid } from "@/lib/utils";

interface Template {
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
const TEMPLATE_SETS: Record<GuidelineTemplate, Template[]> = {
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
const STYLE_META: Record<GuidelineTemplate, { name: string; arName: string; description: string; arDescription: string }> = {
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
const STUDIO_STYLE_META: Record<StudioStyle, { name: string; arName: string; description: string; arDescription: string }> = {
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

const FILE_ASSET_TYPES: AssetType[] = ["pdf", "font", "mockup", "export"];

/**
 * The fixed sections — Logo, Color, Type and friends — are derived from the
 * workspace's own brand data, so there is no block to delete when a studio
 * doesn't want one on the published site. This is where they're switched off,
 * without touching the underlying colors/logos/type themselves.
 */
function SectionVisibility({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const { toggleSectionHidden, setSectionStyle } = useApp();
  const v = useGuidelineViewer(ws.slug);

  if (v.availableFixed.length === 0) return null;

  /**
   * Parking now lives on the section's own style, where the canvas can show it
   * set aside rather than making it disappear. `hiddenSections` is the older
   * store for the same decision, so it is still read — a workspace parked
   * before this existed must not quietly come back online — and cleared
   * whenever a section is put back, so the two can't end up disagreeing.
   */
  function setParked(sectionId: string, parked: boolean) {
    setSectionStyle(ws.id, sectionId, { hidden: parked ? true : undefined });
    if (!parked && ws.hiddenSections.includes(sectionId)) toggleSectionHidden(ws.id, sectionId);
  }

  const parkedCount = v.availableFixed.filter(
    (s) => ws.hiddenSections.includes(s.id) || ws.sectionStyles[s.id]?.hidden === true
  ).length;

  return (
    /**
     * A disclosure, not a permanently open list.
     *
     * There are fourteen sections now and the list sat above the tab panel at
     * full height, so whichever tab you picked opened below the fold. It is a
     * thing you come to occasionally — deciding what the client sees — not a
     * thing you need in view while dragging blocks around, and the summary line
     * says how many are off without opening it.
     */
    <details className="flex flex-col gap-1.5 shrink-0">
      <summary
        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase px-1 cursor-pointer list-none select-none"
        style={{ letterSpacing: "0.08em", color: "var(--text-faint)" }}
      >
        <Icon name="angle-right" size={10} className="mk-disclosure" />
        {isAr ? "أقسام الصفحة" : "Page sections"}
        <span className="ms-auto font-normal" style={{ letterSpacing: 0 }}>
          {parkedCount > 0
            ? isAr
              ? `${parkedCount} مخفي`
              : `${parkedCount} off`
            : `${v.availableFixed.length}`}
        </span>
      </summary>
      <div className="flex flex-col rounded-xl overflow-hidden mt-1.5" style={{ background: "var(--surface-1)" }}>
        {v.availableFixed.map((s) => {
          const hidden = ws.hiddenSections.includes(s.id) || ws.sectionStyles[s.id]?.hidden === true;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setParked(s.id, !hidden)}
              title={hidden ? (isAr ? "إظهار القسم" : "Show section") : (isAr ? "إخفاء القسم" : "Hide section")}
              className="flex items-center gap-2 px-3 h-9 text-[12px] cursor-pointer text-start"
              style={{ color: hidden ? "var(--text-faint)" : "var(--text)" }}
            >
              <Icon name={hidden ? "times" : "check"} size={12} style={{ color: hidden ? "var(--text-faint)" : "var(--accent)" }} />
              <span className="flex-1 truncate" style={{ textDecoration: hidden ? "line-through" : undefined }}>
                {isAr ? s.arLabel : s.label}
              </span>
            </button>
          );
        })}
      </div>
      <span className="block text-[11px] px-1 mt-1.5" style={{ color: "var(--text-faint)" }}>
        {isAr
          ? "إخفاء قسم يزيله من الموقع المنشور دون حذف بيانات الهوية."
          : "Hiding a section removes it from the published site — your brand data stays."}
      </span>
    </details>
  );
}

export default function BuilderPage() {
  const params = useParams<{ slug: string }>();
  const {
    getWorkspace,
    addBlock,
    updateBlock,
    addTemplateBlocks,
    publishGuideline,
    autoFillBlocks,
    setGuidelineTemplate,
    setStudioStyle,
    setSiteMode,
    addPage,
    renamePage,
    removePage,
    removeBlock,
    setBlockStyle,
    setSectionStyle,
    setSectionOptions,
    undo,
    canUndo,
    redo,
    canRedo,
    uiLang,
  } = useApp();
  const { showToast } = useToast();
  const { confirm, prompt } = useDialog();
  const ws = getWorkspace(params.slug);
  /** A flow id: "block-<id>" for an authored section, or a derived section's own id. */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  /**
   * "template" is where the guideline site's template is chosen, along with the
   * starter sections built for it. It used to live under "style", which is why
   * picking a template meant looking under a heading that doesn't name it.
   * "style" is now what its name says: the ground the site is set on.
   */
  const [tab, setTab] = useState<"layers" | "elements" | "template" | "style">("layers");
  const [activePageId, setActivePageId] = useState<string | null>(null);
  /**
   * Which view the canvas shows, and therefore what may be edited from it.
   *
   * A browser preference rather than brand data: it is where this person was
   * working, not a decision about the brand. It is also why the two halves sit
   * in one state object — the rule about what a view may change reads both.
   */
  const [breakpoint, setBreakpoint] = useLocalPref<Breakpoint>("markyos:ui:builder-bp", "desktop");
  const [previewLang, setPreviewLang] = useState<Lang | null>(null);
  /**
   * The element being dragged off the palette, if any.
   *
   * It has to live here rather than inside the canvas because the two are
   * siblings — the palette is in the left panel and the drop target is the page
   * being edited — and because `DataTransfer.getData` is blocked until the drop,
   * so the canvas could not otherwise tell a block being dragged in from a file
   * being dragged off the desktop.
   */
  const [draggingKind, setDraggingKind] = useState<BlockKind | null>(null);
  // Panel visibility is this browser's preference, not the brand's — see
  // lib/useLocalPref.ts.
  const [leftPref, setLeftPref] = useLocalPref("markyos:ui:builder-left", true);
  const [rightPref, setRightPref] = useLocalPref("markyos:ui:builder-right", true);
  /*
   * A narrow window starts with both panels shut.
   *
   * On a 390px screen the rail took 60, the tools panel 240, and the canvas got
   * the ninety pixels left over — a page editor showing a vertical sliver of
   * the page. The same viewport already outranks the sidebar's own preference
   * for the same reason.
   *
   * Shut to *begin* with, not shut permanently: the panels hold the only route
   * to Insert, Template and Site, so a chevron that does nothing would be worse
   * than the sliver. They open on request, one at a time, because two of them
   * on a phone is the state this rule exists to prevent — and the stored
   * preference is untouched and waiting when the window widens.
   */
  const narrow = useNarrowViewport();
  const [narrowPanel, setNarrowPanel] = useState<"left" | "right" | null>(null);
  const leftOpen = narrow ? narrowPanel === "left" : leftPref;
  const rightOpen = narrow ? narrowPanel === "right" : rightPref;
  const setLeftOpen = (next: boolean) => {
    if (narrow) setNarrowPanel(next ? "left" : null);
    else setLeftPref(next);
  };
  const setRightOpen = (next: boolean) => {
    if (narrow) setNarrowPanel(next ? "right" : null);
    else setRightPref(next);
  };

  const matchingKinds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_BLOCK_KINDS;
    return ALL_BLOCK_KINDS.filter((k) => {
      const m = BLOCK_META[k];
      return (
        m.label.toLowerCase().includes(q) ||
        m.hint.toLowerCase().includes(q) ||
        m.arLabel.includes(q) ||
        CATEGORY_META[m.category].label.toLowerCase().includes(q)
      );
    });
  }, [query]);

  /**
   * Selects a section and brings it on screen.
   *
   * Plain selection is enough for a click on the canvas, where the thing clicked
   * is by definition already visible. It is not enough for anything that names a
   * section from *outside* the canvas: the review panel points at the section
   * you haven't looked at, which is exactly why it has a finding. `data-flow-id`
   * is the hook, set by both editing shells.
   */
  const revealFlow = useCallback((flowId: string | null) => {
    setSelectedId(flowId);
    // Deselecting has nowhere to scroll to.
    if (!flowId) return;
    // Next frame: selecting draws the section's toolbar, which changes its box.
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-flow-id="${CSS.escape(flowId)}"]`);
      if (!el) return;
      /*
       * Smooth for a short hop, instant for a long one.
       *
       * Chromium gives a smooth scroll however long the distance demands:
       * measured at 1.6 seconds to cross a 9,900px guideline. That is a
       * teleport in a scroll's clothing — you watch the whole page stream past
       * and arrive unsure whether you moved or it did, and for a page this long
       * it is the normal case rather than the edge one. A jump is at least
       * honest about having jumped.
       */
      const far = Math.abs(el.getBoundingClientRect().top) > window.innerHeight * 1.5;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: far || reduced ? "auto" : "smooth", block: "center" });
    });
  }, []);

  /**
   * The review of whichever page is on the canvas.
   *
   * Memoised, and above the `!ws` bail so the hook order never changes. The copy
   * rules are a real pass over every string on the page, and the builder
   * re-renders on every keystroke in the inspector — recomputing per keystroke
   * would put a regex sweep in the typing path. `ws` is rebuilt by each edit, so
   * this still re-runs exactly when the page changes.
   */
  const review = useMemo(() => {
    if (!ws) return { findings: [], errors: 0, warnings: 0, checked: 0 };
    const page = activePageId ? ws.pages.find((p) => p.id === activePageId) : undefined;
    return reviewPage({
      blocks: page ? page.blocks : ws.customBlocks,
      traits: ws.strategy.voiceTraits,
      // Only the three the renderer has an empty state for — see
      // `BrandDataPresence`.
      brand: {
        logoSlotsFilled: Object.values(ws.logo).filter((s) => s.phase === "attached").length,
        colorCount: ws.colors.length,
        iconAssetCount: ws.assets.filter((a) => a.type === "icon").length,
      },
    });
  }, [ws, activePageId]);

  /**
   * Keyboard control for the canvas.
   *
   * Every shortcut here bails the moment focus is inside a text field — a
   * builder that deletes the selected section because someone pressed
   * Backspace mid-sentence is worse than one with no shortcuts at all. Ctrl+Z
   * is likewise left to the browser while typing, so word-level undo keeps
   * working inside a field and section-level undo works outside one.
   */
  useEffect(() => {
    function typing() {
      const el = document.activeElement as HTMLElement | null;
      return !!el && (el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA");
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !typing()) {
        setSelectedId(null);
        return;
      }
      const blockId = selectedId?.startsWith("block-") ? selectedId.slice("block-".length) : null;
      if ((e.key === "Delete" || e.key === "Backspace") && !typing() && blockId && ws) {
        e.preventDefault();
        removeBlock(ws.id, blockId, activePageId ?? undefined);
        setSelectedId(null);
        return;
      }
      if (typing()) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      // Both spellings, because both are muscle memory: Shift+Z is the Mac and
      // Adobe convention, Ctrl+Y the Windows one.
      if (mod && ((e.key.toLowerCase() === "z" && e.shiftKey) || e.key.toLowerCase() === "y")) {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, removeBlock, selectedId, ws, activePageId]);

  if (!ws) return null;
  const isAr = uiLang(ws) === "ar";
  const sortedPages = [...ws.pages].sort((a, b) => a.order - b.order);
  const activePage = activePageId ? sortedPages.find((p) => p.id === activePageId) : undefined;
  /**
   * The flat list of record, including blocks nested inside a layout
   * container. The layers tree needs the nested ones; the flow only carries
   * the top-level sections.
   */
  const blocks = [...(activePage ? activePage.blocks : ws.customBlocks)].sort((a, b) => a.order - b.order);
  const selectedBlockId = selectedId?.startsWith("block-") ? selectedId.slice("block-".length) : null;
  const selected = selectedBlockId ? blocks.find((b) => b.id === selectedBlockId) || null : null;

  /**
   * The workspace's own language is the primary one, not English.
   *
   * An Arabic-first studio edits its structure in Arabic. Treating English as
   * "the real view" for every workspace would make RTL permanently second-class
   * for most of this product's users.
   */
  const canvasLang: Lang = previewLang ?? ws.primaryLocale;
  const view: ViewContext = {
    breakpoint,
    dir: canvasLang === "ar" ? "rtl" : "ltr",
    locale: canvasLang,
    primaryLocale: ws.primaryLocale,
  };
  const scope = scopeForView(view);
  /** A derived section is selected: it has a design panel but no content one. */
  const selectedFixedId = selectedId && !selectedId.startsWith("block-") ? selectedId : null;
  const selectedStyle: BlockStyle | undefined = selected
    ? selected.style
    : selectedFixedId
      ? ws.sectionStyles[selectedFixedId]
      : undefined;
  /**
   * How much width the selection-driven panel on the end edge is occupying.
   *
   * Handed to CanvasFrame so the canvas does not re-fit when it opens. The
   * inspector is 300px and the reveal tab that stands in for it is 24px, and
   * both appear only once something is selected — so without this, clicking a
   * section resized the page being edited. See `reserved` in CanvasFrame.
   */
  const inspectorShown = !!(selectedId && (selected || selectedFixedId));
  /**
   * How much narrower the canvas should lay out than the room it has.
   *
   * The goal is unchanged — opening the inspector must not resize the page being
   * edited — but the arithmetic is the other way round now. It used to *add* the
   * panel's width back when the panel was open, which held the scale steady and,
   * once the studio sidebar stopped taking 250px off this route, started
   * computing a scale of 1.0 for a 1200px frame in a 1040px space: the page no
   * longer re-fitted, it simply ran off the end.
   *
   * So the canvas always lays out as though the widest panel were open, whether
   * it is or not. Opening it changes `clientWidth` and this by the same amount in
   * opposite directions, so the scale does not move — and the frame fits in every
   * state rather than in only one of them.
   */
  const PANEL_W = 300;
  const panelTakes = inspectorShown ? (rightOpen ? PANEL_W : 24) : 0;
  const reservedForPanel = panelTakes - PANEL_W;
  const autoFillCount = ws.assets.filter((a) => a.type === "mockup" || a.type === "export").length;
  const previewHref = activePage ? `/v/${ws.slug}/p/${activePage.slug}` : `/v/${ws.slug}`;
  // Every edit bumps updatedAt, so anything newer than the last publish is a
  // change the client hasn't been shown yet.
  const hasUnpublished = !ws.publishedAt || ws.updatedAt > ws.publishedAt;

  /**
   * Publishing asks once when the review found something broken.
   *
   * It asks rather than refuses. A studio sending a client a half-finished page
   * to look at is a normal thing to do, and a builder that decides for them
   * which pages are allowed out would be wrong about that regularly. What it can
   * do is make sure nobody publishes an empty section without having been told
   * it was empty.
   */
  async function handlePublish() {
    if (review.errors > 0) {
      const ok = await confirm({
        title: isAr
          ? `${review.errors} مشكلة في هذه الصفحة — أتريد النشر؟`
          : `${review.errors} thing${review.errors === 1 ? "" : "s"} on this page look${review.errors === 1 ? "s" : ""} broken. Publish anyway?`,
        body: isAr
          ? "راجع القائمة بجوار زر النشر لرؤية ما هي — أقسام فارغة أو روابط لا تعمل يراها العميل كما هي."
          : "The list beside the Publish button says what they are. Empty sections and dead links reach the client exactly as they are here.",
        confirmLabel: isAr ? "انشر على أي حال" : "Publish anyway",
        isAr,
      });
      if (!ok) return;
    }
    publishGuideline(ws!.id);
    showToast(isAr ? "تم نشر الدليل للعملاء." : "Published — clients now see these changes.", "success");
  }

  function handleAutoFill() {
    autoFillBlocks(ws!.id);
    showToast(isAr ? "تمت المزامنة مع الأصول الحالية." : "Synced sections from your current assets.", "success");
  }

  function handleAdd(kind: BlockKind) {
    // With something selected, the palette adds *there* rather than at the
    // bottom. Adding always meant scrolling to the end and dragging the result
    // back up, which is a strange thing to have to do right after choosing
    // where you were working.
    const newId = addBlock(ws!.id, kind, activePage?.id, selectedBlockId ? { after: selectedBlockId } : undefined);
    setSelectedId(`block-${newId}`);
    showToast(
      selected
        ? isAr
          ? "تمت الإضافة تحت العنصر المحدد."
          : "Added below the selected section."
        : isAr
          ? "تمت إضافة عنصر جديد — اضغط عليه للتعديل."
          : "Block added — click it to set it up.",
      "success"
    );
  }

  function handleApplyTemplate(t: Template) {
    addTemplateBlocks(ws!.id, t.blocks, activePage?.id);
    showToast(isAr ? `تمت إضافة "${t.arLabel}".` : `Added "${t.label}".`, "success");
  }

  function handleSelectStyle(style: GuidelineTemplate) {
    setGuidelineTemplate(ws!.id, style);
    showToast(isAr ? `تم تغيير النمط إلى ${STYLE_META[style].arName}.` : `Switched style to ${STYLE_META[style].name}.`, "success");
  }

  function handleSelectStudioStyle(style: StudioStyle) {
    setStudioStyle(ws!.id, style);
    showToast(isAr ? `تم تغيير النمط إلى ${STUDIO_STYLE_META[style].arName}.` : `Switched look to ${STUDIO_STYLE_META[style].name}.`, "success");
  }

  async function handleAddPage() {
    const name = await prompt({
      title: isAr ? "صفحة جديدة" : "New page",
      label: isAr ? "اسم الصفحة" : "Page name",
      placeholder: isAr ? "التطبيقات" : "Applications",
      confirmLabel: isAr ? "إضافة" : "Add page",
      isAr,
    });
    if (!name) return;
    const id = addPage(ws!.id, name);
    setActivePageId(id);
    setSelectedId(null);
    showToast(isAr ? `تمت إضافة صفحة "${name}".` : `Added the "${name}" page.`, "success");
  }

  async function handleRenamePage() {
    if (!activePage) return;
    const name = await prompt({
      title: isAr ? "إعادة تسمية الصفحة" : "Rename page",
      label: isAr ? "اسم الصفحة" : "Page name",
      initialValue: activePage.name,
      confirmLabel: isAr ? "حفظ" : "Save",
      isAr,
    });
    if (!name) return;
    renamePage(ws!.id, activePage.id, name);
  }

  /**
   * A page holds every section the studio arranged on it, and deleting one was
   * a single click with no way back — the same weight of gesture as switching
   * between pages, which sits right next to it.
   */
  async function handleDeletePage() {
    if (!activePage) return;
    const sectionCount = activePage.blocks.length;
    const ok = await confirm({
      title: isAr ? `حذف صفحة "${activePage.name}"؟` : `Delete the "${activePage.name}" page?`,
      body: isAr
        ? "تُحذف الصفحة وترتيب أقسامها. لا يمكن التراجع."
        : sectionCount > 0
          ? `Its layout and the ${sectionCount} section${sectionCount === 1 ? "" : "s"} arranged on it go with it. This can't be undone.`
          : "This can't be undone.",
      confirmLabel: isAr ? "حذف" : "Delete page",
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    removePage(ws!.id, activePage.id);
    setActivePageId(null);
    setSelectedId(null);
    showToast(isAr ? "تم حذف الصفحة." : "Page deleted.", "success");
  }

  return (
    <>
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {!leftOpen && (
          <PanelReveal
            side="start"
            isAr={isAr}
            label={isAr ? "إظهار لوحة الأدوات" : "Show the tools panel"}
            onClick={() => setLeftOpen(true)}
          />
        )}
        {/* Unmounted rather than sized to zero. A zero-width panel keeps every
            control it holds in the DOM: still in the tab order, still read out
            by a screen reader, still found by in-page search — all of it
            invisible. "Hidden" has to mean gone. */}
        {leftOpen && (
        <div
          className="w-[240px] shrink-0 overflow-y-auto overflow-x-hidden p-4 flex flex-col gap-3 animate-panel-from-left rtl:animate-panel-from-right"
          style={{ boxShadow: "inset -1px 0 0 var(--hairline)" }}
        >
          {/*
           * The way back out.
           *
           * The studio's own navigation is not rendered on this route — see the
           * `focused` note in the workspace layout — so the editor has to carry
           * its own exit, and it has to say which brand you are inside. A
           * full-screen mode with no visible way out is a trap, however much
           * canvas it buys.
           */}
          <div className="flex items-center gap-2 shrink-0 -mt-1">
            <Link
              href={`/w/${ws.slug}/overview`}
              aria-label={isAr ? `العودة إلى ${ws.name}` : `Back to ${ws.name}`}
              title={isAr ? `العودة إلى ${ws.name}` : `Back to ${ws.name}`}
              className="h-7 w-7 rounded-lg grid place-items-center cursor-pointer shrink-0"
              style={{ background: "var(--surface-1)", color: "var(--text-muted)" }}
            >
              <Icon name={isAr ? "angle-right" : "angle-left"} size={13} />
            </Link>
            <div className="min-w-0 flex-1 flex flex-col">
              <span className="text-[12.5px] font-semibold truncate leading-tight">{ws.name}</span>
              <span className="text-[10.5px] truncate" style={{ color: "var(--text-faint)" }}>
                {isAr ? "محرر الدليل" : "Guidelines editor"}
              </span>
            </div>
            {/* The collapse control belongs here rather than under a "Tools"
                heading of its own. With the brand named directly above it there
                was nothing left for that heading to say that the panel's own
                contents did not. */}
            <button
              type="button"
              onClick={() => setLeftOpen(false)}
              aria-label={isAr ? "إخفاء لوحة الأدوات" : "Hide the tools panel"}
              title={isAr ? "إخفاء لوحة الأدوات" : "Hide the tools panel"}
              className="h-6 w-6 rounded-md grid place-items-center cursor-pointer shrink-0"
              style={{ color: "var(--text-faint)" }}
            >
              <Icon name={isAr ? "angle-double-right" : "angle-double-left"} size={12} />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10.5px] font-semibold uppercase px-1" style={{ letterSpacing: "0.08em", color: "var(--text-faint)" }}>
              {isAr ? "الصفحات" : "Pages"}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setActivePageId(null);
                  setSelectedId(null);
                }}
                className="h-8 px-3 rounded-full text-[12px] font-semibold cursor-pointer"
                style={{ background: !activePage ? "var(--accent-soft)" : "var(--surface-1)", color: !activePage ? "var(--accent-on-soft)" : "var(--text-muted)" }}
              >
                {isAr ? "الرئيسية" : "Home"}
              </button>
              {sortedPages.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setActivePageId(p.id);
                    setSelectedId(null);
                  }}
                  className="h-8 px-3 rounded-full text-[12px] font-semibold cursor-pointer"
                  style={{ background: activePage?.id === p.id ? "var(--accent-soft)" : "var(--surface-1)", color: activePage?.id === p.id ? "var(--accent-on-soft)" : "var(--text-muted)" }}
                >
                  {isAr ? p.arName : p.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => void handleAddPage()}
                aria-label={isAr ? "إضافة صفحة" : "Add page"}
                className="h-8 w-8 rounded-full grid place-items-center cursor-pointer"
                style={{ background: "var(--surface-1)", color: "var(--text-faint)" }}
              >
                <Icon name="plus" size={12} />
              </button>
            </div>
          </div>

          {/* Layers · Insert · Template · Site. Layers comes first because it
              is the one you come back to: what is on this page, in what order.
              The rest are things you do once and then stop thinking about. */}
          <div className="flex rounded-full p-0.5 shrink-0" style={{ background: "var(--surface-1)" }} role="tablist">
            {(
              [
                ["layers", isAr ? "الطبقات" : "Layers"],
                ["elements", isAr ? "إضافة" : "Insert"],
                ["template", isAr ? "القالب" : "Template"],
                ["style", isAr ? "الموقع" : "Site"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className="flex-1 h-8 rounded-full text-[10.5px] font-semibold cursor-pointer"
                style={{ background: tab === key ? "var(--surface-2)" : "transparent", color: tab === key ? "var(--text)" : "var(--text-faint)" }}
              >
                {label}
              </button>
            ))}
          </div>

          {!activePage && tab !== "layers" && <SectionVisibility ws={ws} isAr={isAr} />}

          {/* Keyed on the tab so the swap animates: the content moves, the
              chrome above it doesn't. */}
          <div key={tab} className="flex flex-col gap-3 animate-tab-in">
          {tab === "layers" ? (
            <LayersTab
              ws={ws}
              pageSlug={activePage?.slug}
              lang={canvasLang}
              selectedId={selectedId}
              // Reveals as well as selects: picking a section out of the tree
              // and then having to go find it on the canvas is the same gap the
              // review panel had.
              onSelect={revealFlow}
              isAr={isAr}
            />
          ) : tab === "elements" ? (
            <>
              <label className="flex items-center gap-2 h-9 px-3 rounded-full" style={{ background: "var(--surface-1)" }}>
                <Icon name="search" size={13} style={{ color: "var(--text-faint)" }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isAr ? "بحث..." : "Search..."}
                  className="bg-transparent outline-none text-[12px] flex-1"
                  style={{ color: "var(--text)" }}
                />
              </label>
              {matchingKinds.length === 0 ? (
                <EmptyHint>{isAr ? "لا توجد نتائج." : "No matches."}</EmptyHint>
              ) : (
                CATEGORY_ORDER.map((cat) => {
                  const kinds = matchingKinds.filter((k) => BLOCK_META[k].category === cat);
                  if (kinds.length === 0) return null;
                  return (
                    <div key={cat} className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 px-1">
                        <Icon name={CATEGORY_META[cat].icon} size={12} style={{ color: "var(--text-faint)" }} />
                        <span className="text-[10.5px] font-semibold uppercase" style={{ letterSpacing: "0.08em", color: "var(--text-faint)" }}>
                          {isAr ? CATEGORY_META[cat].arLabel : CATEGORY_META[cat].label}
                        </span>
                      </div>
                      {kinds.map((kind) => {
                        const meta = BLOCK_META[kind];
                        return (
                          <button
                            key={kind}
                            type="button"
                            onClick={() => handleAdd(kind)}
                            /*
                             * Draggable as well as clickable, and both do
                             * something different on purpose: a click appends
                             * below whatever is selected, a drag puts it exactly
                             * where it is dropped. A palette you can only click
                             * means every new element arrives somewhere other
                             * than where you wanted it and then has to be moved.
                             */
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = "copy";
                              e.dataTransfer.setData(BLOCK_DRAG_TYPE, kind);
                              // Firefox refuses to start a drag with no
                              // text/plain payload, whatever else is set.
                              e.dataTransfer.setData("text/plain", meta.label);
                              setDraggingKind(kind);
                            }}
                            onDragEnd={() => setDraggingKind(null)}
                            title={
                              isAr
                                ? "اضغط للإضافة، أو اسحب إلى المكان الذي تريده"
                                : "Click to add below the selection, or drag it onto the page"
                            }
                            className="mk-card flex items-start gap-2.5 rounded-xl p-2.5 text-start cursor-grab active:cursor-grabbing"
                            style={{ background: "var(--surface-1)" }}
                          >
                            <Icon name={meta.icon} size={16} style={{ color: "var(--accent-text)", marginTop: 2, flexShrink: 0 }} />
                            <div className="min-w-0">
                              <div className="text-[12.5px] font-medium">{isAr ? meta.arLabel : meta.label}</div>
                              <div className="text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>
                                {isAr ? meta.arHint : meta.hint}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </>
          ) : tab === "template" ? (
            <div className="flex flex-col gap-2.5">
              <p className="text-[11.5px] px-1" style={{ color: "var(--text-faint)" }}>
                {isAr
                  ? "قالب موقع الدليل الذي يراه العميل. لكل قالب نظام تصميمه الخاص، والألوان والشعار والخطوط تُقرأ من هذا المشروع في جميعها."
                  : "The template the client's guideline site is built in. Each one is its own design system; colors, logo and type read from this workspace in all of them."}
              </p>

              {(Object.keys(STYLE_META) as GuidelineTemplate[]).map((kind) => (
                <TemplatePreviewCard
                  key={kind}
                  kind={kind}
                  name={isAr ? STYLE_META[kind].arName : STYLE_META[kind].name}
                  description={isAr ? STYLE_META[kind].arDescription : STYLE_META[kind].description}
                  active={ws.guidelineTemplate === kind}
                  ws={ws}
                  onSelect={() => handleSelectStyle(kind)}
                />
              ))}

              {ws.guidelineTemplate === "studio" && (
                <div className="flex flex-col gap-1.5 mt-1 ps-3 animate-fade-in" style={{ boxShadow: isAr ? "inset -1px 0 0 var(--hairline)" : "inset 1px 0 0 var(--hairline)" }}>
                  <p className="text-[11px] px-1 pb-0.5" style={{ color: "var(--text-faint)" }}>
                    {isAr ? "اختر أحد أنماط Studio الثلاثة" : "Pick one of the 3 Studio looks"}
                  </p>
                  {(Object.keys(STUDIO_STYLE_META) as StudioStyle[]).map((style) => (
                    <StudioStylePreviewCard
                      key={style}
                      style={style}
                      name={isAr ? STUDIO_STYLE_META[style].arName : STUDIO_STYLE_META[style].name}
                      description={isAr ? STUDIO_STYLE_META[style].arDescription : STUDIO_STYLE_META[style].description}
                      active={ws.studioStyle === style}
                      ws={ws}
                      onSelect={() => handleSelectStudioStyle(style)}
                    />
                  ))}
                </div>
              )}

              {/* The starter sections belong with the template rather than on a
                  tab of their own: they are written for whichever template is
                  selected, and choosing one is the moment you want them. */}
              <div className="h-px mx-1 mt-2" style={{ background: "var(--hairline)" }} />
              <span className="text-[10.5px] font-semibold uppercase px-1 pt-1" style={{ letterSpacing: "0.08em", color: "var(--text-faint)" }}>
                {isAr ? "أقسام جاهزة" : "Starter sections"}
              </span>
              <p className="text-[11px] px-1 -mt-1.5" style={{ color: "var(--text-faint)" }}>
                {isAr
                  ? `مكتوبة لأسلوب ${STYLE_META[ws.guidelineTemplate].arName} — وكل عنصر يُضاف يبقى قابلًا للتعديل أو الحذف.`
                  : `Written for the ${STYLE_META[ws.guidelineTemplate].name} template — everything added stays editable or deletable.`}
              </p>
              {TEMPLATE_SETS[ws.guidelineTemplate].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleApplyTemplate(t)}
                  className="mk-card flex items-start gap-2.5 rounded-xl p-2.5 text-start cursor-pointer"
                  style={{
                    background: t.featured ? "var(--accent-soft)" : "var(--surface-1)",
                    boxShadow: t.featured ? "inset 0 0 0 1px var(--accent)" : "inset 0 0 0 1px transparent",
                  }}
                >
                  <Icon name={t.icon} size={16} style={{ color: "var(--accent-text)", marginTop: 2, flexShrink: 0 }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12.5px] font-medium">{isAr ? t.arLabel : t.label}</span>
                      {t.featured && (
                        <span
                          // Solid rather than accent: this is a 9px badge, and
                          // accent-ink on accent is 6.6:1 — fine at 13px, under
                          // the bar for type this small. `--solid` is the
                          // opposite of the ground by definition, so it clears
                          // it with room to spare in both themes.
                          className="text-[9px] font-semibold px-1.5 py-[2px] rounded-full shrink-0"
                          style={{ background: "var(--solid)", color: "var(--solid-ink)" }}
                        >
                          {isAr ? "صفحة كاملة" : "FULL PAGE"}
                        </span>
                      )}
                    </div>
                    {/* A step up from `--text-faint` on the featured card: the
                        accent tint lifts its ground, and the faintest level in
                        the ramp is solved against plain surfaces, not tinted
                        ones. It measured 4.38:1 here. The card being featured
                        is also a reason for its copy not to be the quietest
                        thing on screen. */}
                    <div
                      className="text-[11px] mt-0.5"
                      style={{ color: t.featured ? "var(--text-muted)" : "var(--text-faint)" }}
                    >
                      {isAr ? t.arHint : t.hint}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <p className="text-[11.5px] px-1 pb-1" style={{ color: "var(--text-faint)" }}>
                {isAr
                  ? "الأرضية التي يُبنى عليها موقع العميل. القالب نفسه يُختار من تبويب «القالب»."
                  : "The ground the client's site is set on. The template itself is chosen on the Template tab."}
              </p>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10.5px] font-semibold uppercase px-1" style={{ letterSpacing: "0.08em", color: "var(--text-faint)" }}>
                  {isAr ? "أرضية الموقع" : "Site ground"}
                </span>
                <div className="flex rounded-full p-0.5" style={{ background: "var(--surface-1)" }}>
                  {(["auto", "light", "dark"] as const).map((m) => {
                    const active = ws.siteMode === m;
                    const label = { auto: isAr ? "تلقائي" : "Auto", light: isAr ? "فاتح" : "Light", dark: isAr ? "داكن" : "Dark" }[m];
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSiteMode(ws.id, m)}
                        className="flex-1 h-8 rounded-full text-[11px] font-semibold cursor-pointer"
                        style={{ background: active ? "var(--surface-2)" : "transparent", color: active ? "var(--text)" : "var(--text-faint)" }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[11px] px-1" style={{ color: "var(--text-faint)" }}>
                  {isAr
                    ? "«تلقائي» يتبع نظام تصميم القالب المختار — بعض القوالب فاتحة بطبيعتها وبعضها داكن — ويستخدم لونًا باسم Canvas من لوحتك عندما يتوافق معه. هذا يخص موقع العميل فقط — سمة لوحة التحكم منفصلة."
                    : "Auto follows the chosen template's design system — some are light systems, some dark — and uses a Canvas swatch from your palette when it agrees. This is the client's site only; your own interface theme is separate."}
                </span>
              </div>

              {/* Switching the ground is the single change most likely to break
                  legibility, so the consequences are shown right underneath the
                  control that causes them rather than on another page. */}
              <div className="mk-surface rounded-xl p-3.5 animate-fade-in" style={{ background: "var(--surface-1)" }}>
                <ContrastReport ws={ws} isAr={isAr} compact />
              </div>
            </div>
          )}
          </div>
        </div>
        )}

        {/*
         * The canvas region, and the positioning context for what floats over it.
         *
         * `relative` so the ship cluster can sit in its bottom corner rather than
         * in a bar across the top of the window. That is the one piece of chrome
         * a studio reaches for at the end of a session rather than during one,
         * and it is the last thing that should be taking a row of the screen.
         */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative" style={{ background: "var(--surface-1)" }}>
          <div
            className="shrink-0 h-12 px-5 flex items-center gap-2"
            style={{ boxShadow: "inset 0 -1px 0 var(--hairline)" }}
          >
            <span className="text-[13px] font-semibold">
              {activePage ? (isAr ? activePage.arName : activePage.name) : isAr ? "الرئيسية" : "Home"}
            </span>
            {activePage && (
              <>
                <button type="button" onClick={() => void handleRenamePage()} aria-label="Rename page" className="mk-icon-btn cursor-pointer">
                  <Icon name="pen" size={13} style={{ color: "var(--text-faint)" }} />
                </button>
                <button type="button" onClick={() => void handleDeletePage()} aria-label="Delete page" title="Delete this page" className="mk-icon-btn mk-danger-hover cursor-pointer">
                  <Icon name="times" size={14} style={{ color: "var(--text-faint)" }} />
                </button>
              </>
            )}
            <span className="text-[11.5px] truncate" style={{ color: "var(--text-faint)" }}>
              {activePage ? `/v/${ws.slug}/p/${activePage.slug}` : `/v/${ws.slug}`}
            </span>
            {/*
              The hint sits outside the control group and takes all the slack.

              It used to be between the view switcher and Auto-fill, and it says
              something different depending on whether anything is selected —
              "Click any text to edit it in place" against "Selected: overview".
              Those are different widths, so the whole group resized and the
              view switcher slid sideways every time somebody clicked a section.
              Prose can reflow; a control somebody is aiming at may not move.
              `flex-1` gives this box a fixed size and right-aligns the words
              inside it, so the message can change without anything else moving.
            */}
            <span
              className="flex-1 min-w-0 text-[11.5px] hidden xl:flex items-center justify-end gap-2"
              style={{ color: "var(--text-faint)" }}
            >
              {selectedId ? (
                  <>
                    {isAr ? "المحدد:" : "Selected:"}
                    <span style={{ color: "var(--text-muted)" }}>
                      {selected ? BLOCK_META[selected.kind].label : selectedId}
                    </span>
                    <Kbd>Esc</Kbd>
                    {isAr ? "لإلغاء التحديد" : "to deselect"}
                    {selected && (
                      <>
                        <Kbd>Del</Kbd>
                        {isAr ? "للحذف" : "to delete"}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {isAr ? "اضغط على أي نص لتحريره مباشرة" : "Click any text to edit it in place"}
                    <Kbd>⌘Z</Kbd>
                    {isAr ? "للتراجع" : "to undo"}
                  </>
                )}
            </span>

            {/* The controls, pinned to the end edge. `ms-auto` still carries
                them there below xl, where the hint above is not rendered and
                there is no flexible box to take the slack. */}
            <span className="ms-auto xl:ms-2.5 flex items-center gap-2.5 shrink-0">
              {/* Undo and redo as a pair, in the one contextual bar this editor
                  has now that the app's top bar is gone. A lone undo button is
                  the shape of an editor that can walk you back but not forward
                  again, which makes trying something out cost more than it
                  should. */}
              <span className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => undo()}
                  disabled={!canUndo}
                  title={isAr ? "تراجع (Ctrl+Z)" : "Undo (Ctrl+Z)"}
                  aria-label={isAr ? "تراجع" : "Undo"}
                  className="h-8 w-8 rounded-full grid place-items-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Icon name="undo" size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => redo()}
                  disabled={!canRedo}
                  title={isAr ? "إعادة (Ctrl+Shift+Z)" : "Redo (Ctrl+Shift+Z)"}
                  aria-label={isAr ? "إعادة" : "Redo"}
                  className="h-8 w-8 rounded-full grid place-items-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                  style={{ color: "var(--text-muted)" }}
                >
                  {/* The undo glyph flipped, rather than a separate icon: these
                      are rotational arrows, counter-clockwise against clockwise,
                      which is why the pair reads the same in both directions and
                      needs no RTL variant. */}
                  <Icon name="undo" size={13} style={{ transform: "scaleX(-1)" }} />
                </button>
              </span>
              <ViewSwitcher
                breakpoint={breakpoint}
                onBreakpoint={setBreakpoint}
                lang={canvasLang}
                onLang={setPreviewLang}
                isAr={isAr}
              />
              {!activePage && (
                <button
                  type="button"
                  disabled={autoFillCount === 0}
                  onClick={handleAutoFill}
                  title={
                    autoFillCount > 0
                      ? isAr
                        ? `يضيف أقسامًا جاهزة من مدير الأصول (${autoFillCount} ملفًا).`
                        : `Adds ready-made sections from your Assets Manager (${autoFillCount} file${autoFillCount === 1 ? "" : "s"}).`
                      : isAr
                        ? "لا توجد نماذج تطبيقية أو ملفات تصدير بعد."
                        : "No mockups or exports in Assets yet."
                  }
                  className="h-8 px-3.5 rounded-full text-[11.5px] font-semibold cursor-pointer shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: "var(--surface-2)", color: "var(--text)" }}
                >
                  {isAr ? "تعبئة تلقائية" : "Auto-fill"}
                </button>
              )}
            </span>
          </div>

          {/*
            The frame is itself the scroll container. Putting the scroll on an
            outer wrapper instead left this card clipping with
            `overflow:hidden`, which silently disables `position: sticky` for
            everything inside it — so the guideline site's own nav scrolled away
            instead of staying at the top of the preview.
          */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-5 pt-3" style={{ background: "var(--surface-0)" }}>
            {scope && (
              <div className="shrink-0 pb-3 mx-auto w-full" style={{ maxWidth: 720 }}>
                <SecondaryViewBanner ctx={view} isAr={isAr} />
              </div>
            )}
            <CanvasFrame breakpoint={breakpoint} dir={view.dir} isAr={isAr} reserved={reservedForPanel}>
              <LiveCanvas
                slug={ws.slug}
                pageSlug={activePage?.slug}
                selectedId={selectedId}
                onSelect={setSelectedId}
                lang={canvasLang}
                onLangChange={setPreviewLang}
                draggingKind={draggingKind}
              />
            </CanvasFrame>
          </div>

          {/*
           * Ship, bottom-end corner, floating over the canvas.
           *
           * Publishing is the thing you do at the end of a session, not during
           * one, and it had a full row of the window across the top of the
           * editor. Down here it is out of the way of the work and still the
           * most prominent control on screen, which is the right order for it.
           *
           * `pointer-events-none` on the rail and `auto` on the cluster: the
           * rail spans the canvas so the cluster can be positioned against its
           * corner, and without that it would swallow clicks on everything
           * beneath it.
           */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none flex justify-end p-4">
            <div
              className="pointer-events-auto flex items-center gap-2 rounded-full p-1.5 ps-3.5"
              style={{
                /*
                 * `--surface-2` and an *inset* ring, not `--surface-0` and an
                 * outer one.
                 *
                 * In the light theme `--surface-0` and `--surface-1` are both
                 * pure white, so a cluster filled with the first and floating
                 * over the second had no fill separation at all — 1.00:1 — and
                 * was leaning entirely on a ring. Inset is also the convention
                 * every card here draws its edge with, and the one the surfaces
                 * sweep knows how to measure; an outer ring is just as visible
                 * to a person and invisible to the check, which is the worse
                 * half of that trade.
                 */
                background: "var(--surface-2)",
                boxShadow: "inset 0 0 0 1px var(--hairline-strong), var(--shadow-pop)",
              }}
            >
              <span
                className="text-[11px] whitespace-nowrap"
                style={{ color: hasUnpublished ? "var(--warning)" : "var(--text-faint)" }}
              >
                {!ws.publishedAt
                  ? isAr ? "غير منشور" : "Not published"
                  : hasUnpublished
                    ? isAr ? "تغييرات غير منشورة" : "Unpublished changes"
                    : isAr ? `نُشر ${formatRelative(ws.publishedAt)}` : `Published ${formatRelative(ws.publishedAt)}`}
              </span>
              <ReviewChip report={review} isAr={isAr} onSelect={revealFlow} />
              <Link
                href={`${previewHref}?preview=1`}
                target="_blank"
                title={isAr ? "افتح الموقع في تبويب جديد" : "Open the site in a new tab"}
                className="h-9 px-3.5 rounded-full text-[12px] font-semibold cursor-pointer flex items-center gap-1.5"
                style={{ background: "var(--surface-2)", color: "var(--text)" }}
              >
                <Icon name="eye" size={13} />
                {isAr ? "معاينة" : "Preview"}
              </Link>
              <button
                type="button"
                onClick={() => void handlePublish()}
                disabled={!!ws.publishedAt && !hasUnpublished}
                // A blocked action that does not say what is blocking it sends
                // someone hunting through settings for a permission they already
                // have. The reason is one sentence and it ends the search.
                title={
                  !!ws.publishedAt && !hasUnpublished
                    ? isAr
                      ? "لا توجد تغييرات منذ آخر نشر."
                      : "Nothing has changed since the last publish."
                    : isAr
                      ? "انشر التغييرات ليراها العميل."
                      : "Push these changes to the client's site."
                }
                className="h-9 px-4 rounded-full text-[12px] font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: "var(--solid)", color: "var(--solid-ink)" }}
              >
                {isAr ? "نشر" : "Publish"}
              </button>
            </div>
          </div>
        </div>

        {selectedId && (selected || selectedFixedId) && !rightOpen && (
          <PanelReveal
            side="end"
            isAr={isAr}
            label={isAr ? "إظهار لوحة التصميم" : "Show the design panel"}
            onClick={() => setRightOpen(true)}
          />
        )}

        {selectedId && (selected || selectedFixedId) && rightOpen && (
          <div
            className="w-[300px] shrink-0 overflow-y-auto p-4 flex flex-col gap-5 animate-panel-from-right rtl:animate-panel-from-left"
            style={{ boxShadow: "inset 1px 0 0 var(--hairline)" }}
          >
            <div className="flex items-center justify-between gap-2 shrink-0 -mb-1">
              <span className="text-[10.5px] font-semibold uppercase" style={{ letterSpacing: "0.08em", color: "var(--text-faint)" }}>
                {isAr ? "التصميم" : "Design"}
              </span>
              <button
                type="button"
                onClick={() => setRightOpen(false)}
                aria-label={isAr ? "إخفاء لوحة التصميم" : "Hide the design panel"}
                title={isAr ? "إخفاء لوحة التصميم" : "Hide the design panel"}
                className="h-6 w-6 rounded-md grid place-items-center cursor-pointer shrink-0"
                style={{ color: "var(--text-faint)" }}
              >
                <Icon name={isAr ? "angle-double-left" : "angle-double-right"} size={12} />
              </button>
            </div>

            {selected ? (
              <BlockInspector
                block={selected}
                ws={ws}
                isAr={isAr}
                onChange={(patch) => updateBlock(ws!.id, selected.id, patch, activePage?.id)}
              />
            ) : (
              <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                {isAr
                  ? "هذا القسم مبني من بيانات الهوية — عدّله من صفحته الخاصة. ما يمكن ضبطه هنا هو شكله على الموقع: الخلفية، الحشو، العرض والحجم."
                  : "This section is built from your brand data — edit that on its own page. What you set here is how it looks on the site: its background, padding, width and scale."}
              </span>
            )}

            <DesignInspector
              isAr={isAr}
              ws={ws}
              style={selectedStyle}
              // Only the derived sections have layouts and parts to choose
              // between — an authored block's shape is the block kind you picked.
              sectionId={selectedFixedId}
              options={selectedFixedId ? resolveOptions(selectedFixedId, ws.sectionOptions[selectedFixedId]) : undefined}
              onOptionsChange={(patch) => {
                if (selectedFixedId) setSectionOptions(ws!.id, selectedFixedId, patch);
              }}
              view={{ breakpoint, dir: view.dir, scope }}
              onChange={(next) => {
                // A whole replacement rather than a patch: the inspector has
                // to be able to *remove* an override, and a patch merge cannot
                // express "this key is no longer here".
                if (selected) setBlockStyle(ws!.id, selected.id, next, activePage?.id, { replace: true });
                else if (selectedFixedId) setSectionStyle(ws!.id, selectedFixedId, next, { replace: true });
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}

/**
 * The handle a hidden panel leaves behind.
 *
 * A panel that collapses to nothing is a panel people can't find again, so
 * something always stays on the edge it went to. It is deliberately a thin
 * strip rather than a floating button: it reads as the panel's own edge, and it
 * doesn't cover any of the canvas it just gave room to.
 */
function PanelReveal({
  side,
  isAr,
  label,
  onClick,
}: {
  side: "start" | "end";
  isAr: boolean;
  label: string;
  onClick: () => void;
}) {
  // The chevron points the way the panel will grow. "start" grows inward from
  // the leading edge, which is rightward in English and leftward in Arabic, so
  // the arrow has to follow the writing direction rather than be fixed.
  const pointsRight = side === "start" ? !isAr : isAr;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="w-6 shrink-0 grid place-items-center cursor-pointer transition-colors mk-reveal"
      style={{
        boxShadow: side === "start" ? "inset -1px 0 0 var(--hairline)" : "inset 1px 0 0 var(--hairline)",
        color: "var(--text-faint)",
      }}
    >
      <Icon name={pointsRight ? "angle-double-right" : "angle-double-left"} size={12} />
    </button>
  );
}

/** A keyboard key, so a shortcut reads as a key rather than as prose. */
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="px-1.5 py-[2px] rounded text-[10.5px] font-semibold"
      style={{
        fontFamily: "ui-monospace, Menlo, monospace",
        background: "var(--surface-2)",
        color: "var(--text-muted)",
      }}
    >
      {children}
    </kbd>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  dir,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: "rtl" | "ltr";
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium" style={{ color: "var(--text-faint)" }}>{label}</span>
      <input
        dir={dir}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 px-3 rounded-lg outline-none text-[12.5px]"
        style={{ background: "var(--surface-1)", color: "var(--text)" }}
      />
    </label>
  );
}

function LabeledTextarea({
  label,
  value,
  onChange,
  dir,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: "rtl" | "ltr";
  rows?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium" style={{ color: "var(--text-faint)" }}>{label}</span>
      <textarea
        dir={dir}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2.5 rounded-lg outline-none text-[12.5px] resize-none"
        style={{ background: "var(--surface-1)", color: "var(--text)" }}
      />
    </label>
  );
}

/* The design controls — the choice rows, the palette picker and the panel that
   arranges them — now live in components/builder/DesignInspector.tsx, where
   they can be scope-aware. A control that writes a phone override has to know
   which view it is being used from, and that is not something a page-local
   helper had any way of knowing. */

function BlockInspector({
  block,
  ws,
  isAr,
  onChange,
}: {
  block: PageBlock;
  ws: Workspace;
  isAr: boolean;
  onChange: (patch: Partial<PageBlock>) => void;
}) {
  const pickableFiles = ws.assets.filter((a) => FILE_ASSET_TYPES.includes(a.type));
  const ids = block.assetIds || [];
  const links = block.socialLinks || [];

  function updateLink(id: string, patch: Partial<SocialLink>) {
    onChange({ socialLinks: links.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  }

  return (
    <div className="flex flex-col gap-4">
      <span className="text-[11px] font-medium uppercase" style={{ letterSpacing: ".08em", color: "var(--text-faint)" }}>
        {isAr ? "إعدادات العنصر" : "Block settings"}
      </span>

      {(block.kind === "brandLogo" || block.kind === "brandColors" || block.kind === "brandType" || block.kind === "brandIcons") && (
        <>
          <LabeledInput label={isAr ? "عنوان القسم (إنجليزي)" : "Section title (English)"} value={block.title || ""} onChange={(v) => onChange({ title: v })} />
          <LabeledInput label={isAr ? "عنوان القسم (عربي)" : "Section title (Arabic)"} value={block.arTitle || ""} onChange={(v) => onChange({ arTitle: v })} dir="rtl" />
          <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
            {isAr
              ? "هذا عرض حي — لا يوجد محتوى لتعديله هنا. غيّر الشعار أو الألوان أو الخطوط أو الأيقونات من صفحاتها الخاصة وسيتحدث هذا القسم تلقائيًا."
              : "This is a live view — there's no content to edit here. Change the logo, colors, typography, or icons from their own pages and this section updates automatically."}
          </span>
        </>
      )}

      {block.kind === "files" && (
        <>
          <LabeledInput label={isAr ? "عنوان القسم (اختياري)" : "Section title (optional)"} value={block.title || ""} onChange={(v) => onChange({ title: v })} />
          <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
            {isAr ? "اختر الملفات القابلة للتحميل" : "Pick downloadable files"}
          </span>
          {pickableFiles.length === 0 ? (
            <EmptyHint>{isAr ? "ارفع ملفات PDF أو خطوطًا أو ملفات تصدير في صفحة الأصول أولاً." : "Upload PDFs, fonts, or exports in Assets first."}</EmptyHint>
          ) : (
            <div className="flex flex-col gap-1.5">
              {pickableFiles.map((a) => {
                const active = ids.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onChange({ assetIds: active ? ids.filter((x) => x !== a.id) : [...ids, a.id] })}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-start cursor-pointer"
                    style={{ background: "var(--surface-1)", boxShadow: active ? "inset 0 0 0 2px var(--accent)" : "inset 0 0 0 1px transparent" }}
                  >
                    <Icon name="file-alt" size={14} style={{ color: "var(--accent-text)", flexShrink: 0 }} />
                    <span className="flex-1 min-w-0 truncate text-[12px]">{a.fileName}</span>
                    <span className="text-[10.5px] shrink-0" style={{ color: "var(--text-faint)" }}>{formatBytes(a.sizeKB)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {block.kind === "text" && (
        <>
          <LabeledInput label={isAr ? "العنوان (إنجليزي)" : "Title (English)"} value={block.title || ""} onChange={(v) => onChange({ title: v })} />
          <LabeledInput label={isAr ? "العنوان (عربي)" : "Title (Arabic)"} value={block.arTitle || ""} onChange={(v) => onChange({ arTitle: v })} dir="rtl" />
          <LabeledTextarea label={isAr ? "النص (إنجليزي)" : "Body (English)"} value={block.text || ""} onChange={(v) => onChange({ text: v })} />
          <LabeledTextarea label={isAr ? "النص (عربي)" : "Body (Arabic)"} value={block.arText || ""} onChange={(v) => onChange({ arText: v })} dir="rtl" />
        </>
      )}

      {block.kind === "quote" && (
        <>
          <LabeledTextarea label={isAr ? "الاقتباس (إنجليزي)" : "Quote (English)"} value={block.text || ""} onChange={(v) => onChange({ text: v })} rows={3} />
          <LabeledTextarea label={isAr ? "الاقتباس (عربي)" : "Quote (Arabic)"} value={block.arText || ""} onChange={(v) => onChange({ arText: v })} dir="rtl" rows={3} />
          <LabeledInput label={isAr ? "المصدر" : "Attribution"} value={block.attribution || ""} onChange={(v) => onChange({ attribution: v })} />
        </>
      )}

      {(block.kind === "image" || block.kind === "gallery") && (
        <>
          <LabeledInput label={isAr ? "تسمية (إنجليزي)" : "Caption (English)"} value={block.title || ""} onChange={(v) => onChange({ title: v })} />
          <LabeledInput label={isAr ? "تسمية (عربي)" : "Caption (Arabic)"} value={block.arTitle || ""} onChange={(v) => onChange({ arTitle: v })} dir="rtl" />
          <ImagePicker
            ws={ws}
            isAr={isAr}
            multiple={block.kind === "gallery"}
            selectedIds={ids}
            onChange={(next) => onChange({ assetIds: next })}
          />
        </>
      )}

      {block.kind === "video" && (
        <>
          <LabeledInput
            label={isAr ? "رابط الفيديو" : "Video URL"}
            value={block.videoUrl || ""}
            onChange={(v) => onChange({ videoUrl: v })}
            dir="ltr"
            placeholder="https://youtube.com/watch?v=..."
          />
          <LabeledInput label={isAr ? "العنوان (اختياري)" : "Heading (optional)"} value={block.title || ""} onChange={(v) => onChange({ title: v })} />
          <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
            {isAr ? "يدعم روابط YouTube وVimeo." : "Supports YouTube and Vimeo links."}
          </span>
        </>
      )}

      {block.kind === "button" && (
        <>
          <LabeledInput label={isAr ? "التسمية (إنجليزي)" : "Label (English)"} value={block.title || ""} onChange={(v) => onChange({ title: v })} />
          <LabeledInput label={isAr ? "التسمية (عربي)" : "Label (Arabic)"} value={block.arTitle || ""} onChange={(v) => onChange({ arTitle: v })} dir="rtl" />
          <LabeledInput label={isAr ? "الرابط" : "Link URL"} value={block.linkUrl || ""} onChange={(v) => onChange({ linkUrl: v })} dir="ltr" placeholder="https://" />
        </>
      )}

      {block.kind === "stat" && (
        <>
          <LabeledInput label={isAr ? "الرقم (إنجليزي)" : "Value (English)"} value={block.title || ""} onChange={(v) => onChange({ title: v })} />
          <LabeledInput label={isAr ? "الرقم (عربي)" : "Value (Arabic)"} value={block.arTitle || ""} onChange={(v) => onChange({ arTitle: v })} dir="rtl" />
          <LabeledInput label={isAr ? "الوصف (إنجليزي)" : "Caption (English)"} value={block.text || ""} onChange={(v) => onChange({ text: v })} />
          <LabeledInput label={isAr ? "الوصف (عربي)" : "Caption (Arabic)"} value={block.arText || ""} onChange={(v) => onChange({ arText: v })} dir="rtl" />
        </>
      )}

      {block.kind === "faq" && (
        <>
          <LabeledInput label={isAr ? "السؤال (إنجليزي)" : "Question (English)"} value={block.title || ""} onChange={(v) => onChange({ title: v })} />
          <LabeledInput label={isAr ? "السؤال (عربي)" : "Question (Arabic)"} value={block.arTitle || ""} onChange={(v) => onChange({ arTitle: v })} dir="rtl" />
          <LabeledTextarea label={isAr ? "الإجابة (إنجليزي)" : "Answer (English)"} value={block.text || ""} onChange={(v) => onChange({ text: v })} rows={3} />
          <LabeledTextarea label={isAr ? "الإجابة (عربي)" : "Answer (Arabic)"} value={block.arText || ""} onChange={(v) => onChange({ arText: v })} dir="rtl" rows={3} />
        </>
      )}

      {block.kind === "socialLinks" && (
        <>
          <div className="flex flex-col gap-2">
            {links.map((l) => (
              <div key={l.id} className="flex items-center gap-1.5">
                <input
                  value={l.platform}
                  onChange={(e) => updateLink(l.id, { platform: e.target.value })}
                  placeholder={isAr ? "المنصة" : "Platform"}
                  className="h-9 px-2.5 rounded-lg outline-none text-[12px] w-[90px] shrink-0"
                  style={{ background: "var(--surface-1)", color: "var(--text)" }}
                />
                <input
                  dir="ltr"
                  value={l.url}
                  onChange={(e) => updateLink(l.id, { url: e.target.value })}
                  placeholder="https://"
                  className="h-9 px-2.5 rounded-lg outline-none text-[12px] flex-1 min-w-0"
                  style={{ background: "var(--surface-1)", color: "var(--text)" }}
                />
                <button
                  type="button"
                  onClick={() => onChange({ socialLinks: links.filter((x) => x.id !== l.id) })}
                  aria-label="Remove link"
                  className="mk-icon-btn cursor-pointer shrink-0"
                >
                  <Icon name="times" size={12} style={{ color: "var(--text-faint)" }} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onChange({ socialLinks: [...links, { id: uid(), platform: "", url: "" }] })}
            className="text-[12px] font-semibold cursor-pointer self-start"
            style={{ color: "var(--accent-text)" }}
          >
            {isAr ? "+ إضافة رابط" : "+ Add link"}
          </button>
        </>
      )}

      {block.kind === "form" && (
        <>
          <LabeledInput label={isAr ? "العنوان (إنجليزي)" : "Heading (English)"} value={block.title || ""} onChange={(v) => onChange({ title: v })} />
          <LabeledInput label={isAr ? "العنوان (عربي)" : "Heading (Arabic)"} value={block.arTitle || ""} onChange={(v) => onChange({ arTitle: v })} dir="rtl" />
          <LabeledInput label={isAr ? "الوصف (إنجليزي)" : "Description (English)"} value={block.text || ""} onChange={(v) => onChange({ text: v })} />
          <LabeledInput label={isAr ? "الوصف (عربي)" : "Description (Arabic)"} value={block.arText || ""} onChange={(v) => onChange({ arText: v })} dir="rtl" />
          <LabeledInput
            label={isAr ? "البريد المستقبِل" : "Receiving email"}
            value={block.linkUrl || ""}
            onChange={(v) => onChange({ linkUrl: v })}
            dir="ltr"
            placeholder="hello@studio.com"
          />
          <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
            {isAr
              ? "عند الإرسال، يفتح الزائر تطبيق البريد الخاص به — لا يوجد خادم خلفي."
              : "On submit, this opens the visitor's own email client — there's no backend involved."}
          </span>
        </>
      )}

      {block.kind === "spacer" && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium" style={{ color: "var(--text-faint)" }}>{isAr ? "الحجم" : "Size"}</span>
          <div className="flex gap-1.5">
            {(["sm", "md", "lg"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ size: s })}
                className="h-8 px-3 rounded-full text-[11px] font-semibold cursor-pointer"
                style={{ background: (block.size || "md") === s ? "var(--accent-soft)" : "var(--surface-1)", color: (block.size || "md") === s ? "var(--accent-on-soft)" : "var(--text-muted)" }}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {block.kind === "embed" && (
        <>
          <span className="text-[11px]" style={{ color: "var(--warning)" }}>
            {isAr
              ? "يتم عرض هذا الكود كما هو على موقع الدليل. يمكنك لصق كود تضمين حقيقي من Calendly أو Typeform أو Mailchimp أو غيرها."
              : "Rendered as-is on the guideline site. Paste a real embed snippet from Calendly, Typeform, Mailchimp, Google Forms, etc."}
          </span>
          <textarea
            dir="ltr"
            value={block.embedHtml || ""}
            onChange={(e) => onChange({ embedHtml: e.target.value })}
            rows={12}
            placeholder="<div>Your HTML here</div>"
            className="px-3 py-2.5 rounded-lg outline-none text-[11.5px] resize-none"
            style={{ background: "var(--surface-1)", color: "var(--text)", fontFamily: "ui-monospace, Menlo, monospace" }}
          />
        </>
      )}

      {block.kind === "columns" && (
        <>
          <span className="text-[11px] font-semibold uppercase" style={{ letterSpacing: ".08em", color: "var(--text-faint)" }}>
            {isAr ? "عدد الأعمدة" : "Columns"}
          </span>
          <div className="flex rounded-full p-0.5" style={{ background: "var(--surface-1)" }}>
            {[2, 3].map((n) => {
              const active = (block.columnCount ?? 2) === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange({ columnCount: n })}
                  className="flex-1 h-8 rounded-full text-[12px] font-semibold cursor-pointer"
                  style={{ background: active ? "var(--surface-2)" : "transparent", color: active ? "var(--text)" : "var(--text-faint)" }}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <EmptyHint>
            {isAr
              ? "اضغط «أضف عنصرًا» داخل أي عمود على الصفحة لإضافة محتوى إليه."
              : "Use the “Add a block” slot inside a column on the page to fill it."}
          </EmptyHint>
        </>
      )}

      {block.kind === "divider" && (
        <EmptyHint>{isAr ? "فاصل بصري بسيط — لا يوجد ما يمكن إعداده." : "A plain visual break — nothing to configure."}</EmptyHint>
      )}
    </div>
  );
}
