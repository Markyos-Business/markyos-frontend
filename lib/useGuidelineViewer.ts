"use client";

import { useEffect, useState } from "react";
import { useApp } from "./store";
import { getBrandTheme } from "./theme";
import { brandFontStacks } from "./brandFonts";
import { BlockStyle, DepartmentView, GuidePage, Lang, PageBlock, SlotKind, Workspace } from "./types";
import { brandSocialLinks, graphicAssets, patternAssets } from "./guidelineAssets";
import { departmentHasContent } from "@/components/workspace/departments/DepartmentDocument";
import { strategyNarrativeFilled } from "@/components/workspace/strategy/StrategyDocument";
import type { TocSection } from "@/components/workspace/guideline/types";

function unlockKey(slug: string) {
  return `markyos:client-unlock:${slug}`;
}

/**
 * One entry in the page's render order: either a section derived from brand
 * data or a block the studio authored. Templates walk this single list instead
 * of hard-coding "logo, then colour, then type, then whatever was added" — the
 * order is data, so a studio can put its own section between two derived ones.
 */
export type FlowItem = { id: string; style?: BlockStyle } & (
  | { kind: "fixed" }
  | { kind: "block"; block: PageBlock }
);

/**
 * Reorders `natural` to follow `preference`, keeping ids the preference has
 * never heard of in their natural place.
 *
 * That last part is the whole point: the stored order is a preference, not a
 * manifest. A section that only came into existence after the last rearrange
 * (the first colour added, a block inserted mid-page) has no stored rank, and
 * sending it to the bottom of the page would be a silent, confusing move. It
 * inherits the rank of whatever precedes it naturally instead, so it lands
 * exactly where the template would have put it.
 */
function applyOrder(natural: string[], preference: string[]): string[] {
  if (preference.length === 0) return natural;
  const rank = new Map(preference.map((id, i) => [id, i]));
  let last = -1;
  return natural
    .map((id, i) => {
      const r = rank.get(id);
      if (r !== undefined) last = r;
      return { id, rank: r ?? last + 0.5, i };
    })
    // The index tiebreak keeps unranked neighbours in their own relative
    // order rather than letting the sort decide.
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map((entry) => entry.id);
}

/**
 * Everything the client-facing guideline site needs — hydration/gating,
 * the password-unlock check, scroll-spy, and the section/page lists —
 * computed once here so the Home route and the per-page route share the
 * exact same logic instead of keeping two copies in sync by hand.
 *
 * Pass `pageSlug` to view one of the workspace's custom GuidePages instead
 * of Home. Home keeps its fixed Overview/Logo/Color/Typography/... anchors
 * plus its own customBlocks; a custom page is just its own block list.
 */
export function useGuidelineViewer(slug: string, pageSlug?: string, mode: "published" | "draft" = "draft") {
  const { getWorkspace, hydrated } = useApp();
  const record = getWorkspace(slug);

  // The client-facing site reads the published snapshot; the editor and the
  // preview read the live draft. Serving the draft publicly is what made every
  // keystroke instantly visible to a studio's clients.
  const ws: Workspace | undefined =
    mode === "published"
      ? record?.published
        ? ({ ...(record.published as Workspace), published: null, publishedAt: record.publishedAt } as Workspace)
        : undefined
      : record;
  /** The workspace exists but has never been published. */
  const notPublished = mode === "published" && !!record && !record.published;

  const [unlocked, setUnlocked] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [previewLang, setPreviewLang] = useState<Lang>("en");
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [activeId, setActiveId] = useState("overview");

  useEffect(() => {
    // One-time sync from the workspace record and sessionStorage into local
    // preview state — both are external to React, so setState here is the
    // legitimate case the rule otherwise guards against. checkedStorage must
    // be set even when there's no matching workspace, or an invalid slug
    // leaves the page stuck on its blank pre-hydration render forever.
    if (ws) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewLang(ws.lang);
      try {
        setUnlocked(window.sessionStorage.getItem(unlockKey(ws.slug)) === "1");
      } catch {
        // sessionStorage unavailable — fall through to the password gate
      }
    }
    setCheckedStorage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws?.id, hydrated]);

  const activePage: GuidePage | undefined = pageSlug ? ws?.pages.find((p) => p.slug === pageSlug) : undefined;
  const pageNotFound = !!pageSlug && !!ws && !activePage;

  const attachedSlots = ws ? (Object.keys(ws.logo) as SlotKind[]).filter((k) => ws.logo[k].phase === "attached") : [];
  const photoAssets = ws ? ws.assets.filter((a) => a.type === "photo") : [];
  const iconAssets = ws ? ws.assets.filter((a) => a.type === "icon") : [];
  /**
   * Applied mockups — the brand on a business card, a shopfront, a phone.
   *
   * These already existed as an asset type and as something "Auto-fill" could
   * dump into a gallery block, but had no section of their own. They are the
   * part of a guideline a client actually looks at first, so they get one.
   */
  const mockupAssets = ws ? ws.assets.filter((a) => a.type === "mockup") : [];
  /**
   * Repeating artwork, plus the illustrations and graphics that had no
   * client-facing section at all until now. Both feed one Pattern section.
   */
  const patterns = ws ? [...patternAssets(ws), ...graphicAssets(ws)] : [];
  /** The accounts the studio actually entered — never guessed from the slug. */
  const socialLinks = ws ? brandSocialLinks(ws) : [];
  // `allBlocks` is the flat list of record, including blocks nested inside
  // layout containers; `customBlocks` is only the top-level ones, since a
  // nested block is rendered by its container and must not also appear as a
  // section of its own in the page flow or the table of contents.
  const allBlocks = ws ? [...(activePage ? activePage.blocks : ws.customBlocks)].sort((a, b) => a.order - b.order) : [];
  const customBlocks = allBlocks.filter((b) => !b.parentId);

  const blockSections = customBlocks
    .filter((b) => b.kind !== "divider")
    .map((b, i) => ({ id: `block-${b.id}`, label: b.title || `Section ${i + 1}`, arLabel: b.arTitle || `قسم ${i + 1}` }));

  const titleOverrides = ws?.sectionTitles ?? {};

  /**
   * A derived section's heading: the studio's own wording if it renamed the
   * section, otherwise whatever the template calls it. Templates pass their
   * own default in, so each keeps its voice ("Logo system" in Vault, "Logo &
   * Symbol" in Signal) until someone actually overrides it.
   */
  function sectionTitle(id: string, fallback: string): string {
    const ov = titleOverrides[id];
    return (previewLang === "ar" ? ov?.ar : ov?.en) || fallback;
  }

  const noteOverrides = ws?.sectionNotes ?? {};

  /**
   * The studio's own line of copy under a section heading, if it wrote one.
   * Unlike the heading there is no default: a derived section says nothing
   * extra until someone has something to say about it.
   */
  function sectionNote(id: string): string {
    const ov = noteOverrides[id];
    return (previewLang === "ar" ? ov?.ar : ov?.en) || "";
  }

  /** A table-of-contents entry that follows a rename in both languages. */
  function toc(id: string, label: string, arLabel: string): TocSection {
    const ov = titleOverrides[id];
    return { id, label: ov?.en || label, arLabel: ov?.ar || arLabel };
  }

  // Every fixed section this workspace *could* show, before the studio's own
  // hide list is applied. Templates ask `showSection(id)` rather than
  // re-deriving these conditions, so the rule for whether a section exists
  // lives here once instead of in five templates that can drift apart.
  /**
   * The narrative half of Strategy — everything except personas and the voice
   * matrix, which already have sections of their own on this site. Including
   * them here too would print the same content twice under two headings.
   */
  const hasStrategyNarrative = !!ws && strategyNarrativeFilled(ws);

  /** Department pages the studio actually chose to publish, and that have content. */
  const publishedDepartments: DepartmentView[] = ws
    ? [...ws.departmentViews]
        .filter((d) => d.publishToSite && departmentHasContent(d))
        .sort((a, b) => a.createdAt - b.createdAt)
    : [];

  /**
   * The statement band — the one sentence a guideline opens on.
   *
   * It defaults to the brand's mission, but it is a section in its own right
   * rather than a fixed echo of the Strategy hub: a studio often wants the
   * cover line to read differently from the internal mission statement, and
   * before this the only way to change it was to rewrite the mission itself.
   * An override alone is enough to give the band content, so it can also say
   * something a brand has no mission field for at all.
   */
  const statementText = ws ? (titleOverrides["statement-text"]?.[previewLang] || ws.strategy.mission) : "";

  const availableFixed: TocSection[] = !ws
    ? []
    : [
        toc("overview", "Overview", "نظرة عامة"),
        // Always present, even with nothing written in it — that empty band is
        // how a studio finds the place to write one. The templates render it
        // only while editing, so a guideline with no statement publishes
        // without an empty stripe across it.
        toc("statement", "Statement", "العبارة"),
        ...(hasStrategyNarrative ? [toc("strategy", "Strategy", "الاستراتيجية")] : []),
        ...(attachedSlots.length > 0 ? [toc("logo", "Logo", "الشعار")] : []),
        // Both are drawn *from* the mark, so neither can exist without one.
        ...(attachedSlots.length > 0 ? [toc("misuse", "Misuse", "استخدامات خاطئة")] : []),
        ...(attachedSlots.length > 0 ? [toc("app-icon", "App icon", "أيقونة التطبيق")] : []),
        ...(ws.colors.length > 0 ? [toc("color", "Color", "الألوان")] : []),
        toc("typography", "Type", "الخطوط"),
        ...(mockupAssets.length > 0 ? [toc("mockups", "In use", "التطبيقات")] : []),
        ...(photoAssets.length > 0 ? [toc("photography", "Photo", "التصوير")] : []),
        ...(patterns.length > 0 ? [toc("patterns", "Pattern", "النقوش")] : []),
        ...(iconAssets.length > 0 ? [toc("icons", "Icons", "الأيقونات")] : []),
        // A profile preview needs a mark to put in the avatar; without one there
        // is nothing to show but the studio's own link list, which the
        // socialLinks block already renders where the studio put it.
        ...(socialLinks.length > 0 && attachedSlots.length > 0 ? [toc("social", "Social", "التواصل")] : []),
        ...(ws.strategy.personas.length > 0 ? [toc("personas", "Personas", "الشخصيات")] : []),
        ...(ws.strategy.voiceTraits.length > 0 ? [toc("voice", "Voice", "الصوت")] : []),
        ...(publishedDepartments.length > 0 ? [toc("departments", "Departments", "الأقسام")] : []),
      ];

  const hidden = ws?.hiddenSections ?? [];

  /** Whether a fixed section should render: it has data, and isn't hidden. */
  function showSection(id: string): boolean {
    return !activePage && availableFixed.some((s) => s.id === id) && !hidden.includes(id);
  }

  /**
   * The page's render order.
   *
   * "overview" is not in here: every template renders it as its cover — a hero
   * with the brand mark and the purpose line, not a numbered section — so it
   * stays at the top and the list below it is what gets rearranged.
   *
   * A custom page has no derived sections at all, so its flow is simply its own
   * blocks, in their stored order.
   */
  const blockIds = customBlocks.map((b) => `block-${b.id}`);
  const naturalFlowIds = activePage
    ? blockIds
    : [...availableFixed.filter((s) => !hidden.includes(s.id)).map((s) => s.id), ...blockIds];

  const flowIds = applyOrder(naturalFlowIds, activePage ? [] : (ws?.sectionOrder ?? []));

  const sectionStyles = ws?.sectionStyles ?? {};

  /**
   * Each item carries its own resolved design overrides.
   *
   * Resolved here rather than looked up by the renderer, because a section's
   * styling is part of what the page *is*, not part of editing it — the
   * client-facing site has no editing context to ask, and reading the style
   * from one is how a published page silently loses everything the studio set.
   */
  const blocksById = new Map(customBlocks.map((b) => [`block-${b.id}`, b]));
  const flow: FlowItem[] = flowIds.map((id) => {
    const block = blocksById.get(id);
    return block ? { id, kind: "block", block, style: block.style } : { id, kind: "fixed", style: sectionStyles[id] };
  });

  /** A derived section's design overrides, or undefined if it has none. */
  function sectionStyle(id: string): BlockStyle | undefined {
    return sectionStyles[id];
  }

  /**
   * Parked: kept in the page but off the published site.
   *
   * A parked section stays in the flow rather than being filtered out of it,
   * because the studio has to be able to see what it has set aside in order to
   * bring it back — dropping it from the canvas is how a section becomes
   * findable only through a checklist somewhere else. The renderer is what
   * leaves it out on the client's side.
   */
  function isParked(item: FlowItem): boolean {
    return item.style?.hidden === true;
  }

  /**
   * The table of contents: the flow, minus anything parked and anything with
   * no heading to list. A divider is real page furniture the studio placed,
   * but it is not a destination, so it takes part in the order without taking
   * a number.
   */
  const flowLabels = new Map([...availableFixed, ...blockSections].map((s) => [s.id, s]));
  const sections: TocSection[] = !ws
    ? []
    : flow
        .filter((item) => !isParked(item))
        // An unwritten statement is a place to write one, not a destination.
        .filter((item) => item.id !== "statement" || !!statementText)
        .map((item) => flowLabels.get(item.id))
        .filter((s): s is TocSection => !!s);

  const sectionIds = sections.map((s) => s.id).join(",");
  // The actual section elements only exist in the DOM once every gate below
  // (hydration, a valid+paid workspace, a valid page, and the password
  // gate) has passed — before that, the component renders a placeholder/
  // gate screen instead. The observer effect must depend on this, or it
  // subscribes to an empty DOM once and never re-subscribes after the real
  // content mounts.
  const contentMounted =
    hydrated && checkedStorage && !!ws && !pageNotFound && ws.billing.plan !== "free" && (!ws.clientAccess.passwordEnabled || unlocked);

  useEffect(() => {
    if (!sectionIds || !contentMounted) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-10% 0px -60% 0px", threshold: 0 }
    );
    sectionIds.split(",").forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sectionIds, contentMounted]);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function sectionIndex(id: string) {
    return sections.findIndex((s) => s.id === id) + 1;
  }

  const theme = ws ? getBrandTheme(ws) : undefined;
  const pages = ws ? [...ws.pages].sort((a, b) => a.order - b.order) : [];
  const fonts = ws ? brandFontStacks(ws) : undefined;

  return {
    ws,
    record,
    notPublished,
    hydrated,
    checkedStorage,
    unlocked,
    setUnlocked,
    pageNotFound,
    theme,
    fonts,
    previewLang,
    setPreviewLang,
    downloadOpen,
    setDownloadOpen,
    activeId,
    sections,
    flow,
    flowIds,
    availableFixed,
    showSection,
    sectionTitle,
    sectionNote,
    sectionStyle,
    statementText,
    scrollTo,
    sectionIndex,
    attachedSlots,
    photoAssets,
    iconAssets,
    mockupAssets,
    publishedDepartments,
    customBlocks,
    allBlocks,
    pages,
    activePage,
    contentMounted,
  };
}
