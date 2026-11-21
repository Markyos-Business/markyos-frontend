"use client";

import { canGoLive } from "@/lib/data/publication";
import { builderCopy } from "../copy";
import { reviewSite, type SiteFinding } from "../utils/site-review";
import { plural } from "@/lib/i18n/plural";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { brandSetup } from "@/lib/data/brandSetup";
import { useApp } from "@/contexts/AppContext";
import { useBrandPage } from "@/contexts/pageGuards";
import { useColorNameTranslations } from "@/features/visual-identity";
import { useDialog, useToast } from "@/components/ui";
import { scopeForView } from "@/lib/doc/core/rules";
import type { Breakpoint, ViewContext } from "@/lib/doc/core/types";
import { useLocalPref } from "@/hooks/useLocalPref";
import type { BlockKind, BlockStyle, GuidelineTemplate, Lang, StudioStyle } from "@/types";
import { PANEL_W, type ToolTab } from "../constants";
import { STUDIO_STYLE_META, STYLE_META, type Template } from "../templates";
import { useBuilderPanels } from "./use-builder-panels";

/**
 * The guidelines editor: which page and section are selected, which view the
 * canvas shows, the page review, keyboard control, and every action the
 * editor's panels offer.
 */
export function useBuilderPage(slug: string) {
  const router = useRouter();
  const {
    addBlock,
    updateBlock,
    addTemplateBlocks,
    publishGuideline,
    unpublishGuideline,
    autoFillBlocks,
    setGuidelineTemplate,
    setStudioStyle,
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
  } = useApp();
  const { showToast } = useToast();
  const { confirm, prompt } = useDialog();
  const page = useBrandPage(slug);
  const ws = page?.workspace;
  // The English and Arabic previews both show colour names; fill in the
  // missing language while an editor is here.
  useColorNameTranslations(ws);
  /** A flow id: "block-<id>" for an authored section, or a derived section's own id. */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /**
   * "template" is where the guideline site's template is chosen, along with the
   * starter sections built for it. It used to live under "style", which is why
   * picking a template meant looking under a heading that doesn't name it.
   * "style" is now what its name says: the ground the site is set on.
   */
  const [tab, setTab] = useState<ToolTab>("layers");
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
  const { leftOpen, rightOpen, setLeftOpen, setRightOpen, narrow: compact, leftWidth, setLeftWidth } = useBuilderPanels();

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
    if (flowId?.startsWith("setup:") && ws) {
      const step = brandSetup(ws).find(step => `setup:${step.key}` === flowId);
      if (step) router.push(step.href);
      return;
    }
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
  }, [ws, router]);

  /** Puts the editor on a review finding: its setup screen, or its page and section. */
  const revealFinding = useCallback((finding: SiteFinding) => {
    if (finding.href) {
      router.push(finding.href);
      return;
    }
    if (finding.pageId !== activePageId) {
      setActivePageId(finding.pageId);
      // The page's sections mount on the next render; select once they exist.
      requestAnimationFrame(() => revealFlow(finding.flowId));
      return;
    }
    revealFlow(finding.flowId);
  }, [activePageId, revealFlow, router]);

  /**
   * The review of whichever page is on the canvas.
   *
   * Memoised, and above the `!ws` bail so the hook order never changes. The copy
   * rules are a real pass over every string on the page, and the builder
   * re-renders on every keystroke in the inspector — recomputing per keystroke
   * would put a regex sweep in the typing path. `ws` is rebuilt by each edit, so
   * this still re-runs exactly when the page changes.
   */
  const review = useMemo(
    () => (ws ? reviewSite(ws) : { findings: [], errors: 0, warnings: 0, checked: 0, pages: 0 }),
    [ws],
  );

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

  if (!page || !ws) return null;
  const { isAr } = page;
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
  const panelTakes = inspectorShown ? (rightOpen ? PANEL_W : 24) : 0;
  const reservedForPanel = panelTakes - PANEL_W;
  const autoFillCount = ws.assets.filter((a) => a.type === "mockup" || a.type === "export").length;
  const previewHref = activePage ? `/v/${ws.slug}/p/${activePage.slug}` : `/v/${ws.slug}`;
  // Every edit bumps updatedAt, so anything newer than the last publish is a
  // change the client hasn't been shown yet.
  const hasUnpublished = !ws.publishedAt || ws.updatedAt > ws.publishedAt;

  /**
   * Publishing stops at Must fix and asks once about Worth checking.
   *
   * Must fix is what would put an empty section, a dead link or a missing logo
   * in front of the public (product decision, 20 Nov 2026), so it blocks, here
   * and on the server. Worth checking (copy, translations, fonts, purpose) has
   * fallbacks, so it only asks: a half-finished page is still a page a studio
   * may want a client to see.
   */
  async function showWhatToFix() {
    const count = isAr
      ? plural("ar", review.errors, { one: "بند واحد", two: "بندان", few: "{n} بنود", many: "{n} بندًا", other: "{n} بند" })
      : plural("en", review.errors, { one: "{n} item", other: "{n} items" });
    const show = await confirm({
      title: isAr ? "لا يمكن النشر بعد" : "This guideline can't be published yet",
      body: isAr
        ? `${count} في قائمة «يجب إصلاحه» يترك أقسامًا فارغة أو روابط لا تعمل في الدليل المنشور. أصلحها ثم انشر.`
        : `${count} under Must fix would leave empty sections or broken links on the published guideline. Fix them, then publish.`,
      confirmLabel: isAr ? "عرض ما يجب إصلاحه" : "Show what to fix",
      cancelLabel: isAr ? "إغلاق" : "Close",
      isAr,
    });
    const first = review.findings.find(f => f.severity === "error");
    if (show && first) revealFinding(first);
  }

  async function handlePublish() {
    // A brand that can't go live (no paid plan) isn't asked to fix anything first.
    if (!canGoLive(ws!)) {
      showToast(builderCopy(isAr).publication.planRequired, "danger");
      return;
    }
    // Must fix stops here, and the server refuses the same list if this is skipped.
    if (review.errors > 0) return showWhatToFix();
    const incomplete = brandSetup(ws!).filter(step => step.key !== "publish" && !step.done);
    if (review.warnings > 0 || incomplete.length > 0) {
      const ok = await confirm({
        title: isAr ? "أتريد النشر الآن؟" : "Publish now?",
        body: [
          review.warnings > 0
            ? isAr
              ? `${plural("ar", review.warnings, { one: "بند واحد", two: "بندان", few: "{n} بنود", many: "{n} بندًا", other: "{n} بند" })} في قائمة «يستحق المراجعة». يمكنك النشر الآن أو مراجعتها أولًا.`
              : `${plural("en", review.warnings, { one: "{n} item", other: "{n} items" })} under Worth checking. You can publish now or review them first.`
            : "",
          incomplete.length ? (isAr ? `لم تكتمل: ${incomplete.map(step => step.arLabel).join("، ")}.` : `Not complete: ${incomplete.map(step => step.label).join(", ")}.`) : "",
        ].filter(Boolean).join("\n\n"),
        confirmLabel: isAr ? "نشر" : "Publish",
        isAr,
      });
      if (!ok) return;
    }
    const result = await publishGuideline(ws!.id);
    if (!result.ok && result.planRequired) {
      showToast(builderCopy(isAr).publication.planRequired, "danger");
      return;
    }
    if (!result.ok && result.blocked) {
      showToast(isAr ? "لم يُنشر الدليل: ما زالت هناك بنود يجب إصلاحها." : "Not published: some Must fix items remain.", "danger");
      return;
    }
    if (!result.ok) {
      showToast(isAr ? "لم يُنشر الدليل. حاول مرة أخرى." : `Not published: ${result.message ?? "try again."}`, "danger");
      return;
    }
    showToast(isAr ? "تم نشر الدليل للعملاء." : "Published — clients now see these changes.", "success");
  }

  async function handleUnpublish() {
    const ok = await confirm({
      title: isAr ? "إيقاف موقع الدليل؟" : "Take the guideline site offline?",
      body: isAr
        ? "سيتوقف رابط العميل عن العمل فورًا. تبقى مسودتك كما هي، ويمكنك النشر مجددًا في أي وقت."
        : "The client's link stops working right away. Your draft stays as it is, and you can publish again at any time.",
      confirmLabel: isAr ? "إيقاف الموقع" : "Take offline",
      isAr,
    });
    if (!ok) return;
    const result = await unpublishGuideline(ws!.id);
    if (!result.ok) {
      showToast(isAr ? "تعذّر إيقاف الموقع. حاول مرة أخرى." : `Still online: ${result.message ?? "try again."}`, "danger");
      return;
    }
    showToast(isAr ? "الموقع غير متاح الآن للعملاء." : "The site is offline. Clients can no longer open it.", "success");
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

  return {
    ws,
    isAr,
    tab,
    onTab: setTab,
    sortedPages,
    activePage,
    onPage: (id: string | null) => {
      setActivePageId(id);
      setSelectedId(null);
    },
    blocks,
    selectedId,
    onSelect: setSelectedId,
    revealFlow,
    revealFinding,
    selected,
    selectedFixedId,
    selectedStyle,
    inspectorShown,
    reservedForPanel,
    canvasLang,
    onPreviewLang: setPreviewLang,
    breakpoint,
    onBreakpoint: setBreakpoint,
    view,
    scope,
    draggingKind,
    onDraggingKind: setDraggingKind,
    compact,
    leftWidth,
    setLeftWidth,
    leftOpen,
    rightOpen,
    setLeftOpen,
    setRightOpen,
    review,
    autoFillCount,
    previewHref,
    hasUnpublished,
    undo,
    redo,
    canUndo,
    canRedo,
    onPublish: () => void handlePublish(),
    onUnpublish: () => void handleUnpublish(),
    onAutoFill: handleAutoFill,
    onAdd: handleAdd,
    onApplyTemplate: handleApplyTemplate,
    onSelectStyle: handleSelectStyle,
    onSelectStudioStyle: handleSelectStudioStyle,
    onAddPage: () => void handleAddPage(),
    onRenamePage: () => void handleRenamePage(),
    onDeletePage: () => void handleDeletePage(),
    onUpdateBlock: (patch: Parameters<typeof updateBlock>[2]) => {
      if (selected) updateBlock(ws.id, selected.id, patch, activePage?.id);
    },
    onOptionsChange: (patch: Parameters<typeof setSectionOptions>[2]) => {
      if (selectedFixedId) setSectionOptions(ws.id, selectedFixedId, patch);
    },
    // A whole replacement rather than a patch: the inspector has to be able to
    // *remove* an override, and a patch merge cannot express "this key is no
    // longer here".
    onStyleChange: (next: BlockStyle) => {
      if (selected) setBlockStyle(ws.id, selected.id, next, activePage?.id, { replace: true });
      else if (selectedFixedId) setSectionStyle(ws.id, selectedFixedId, next, { replace: true });
    },
  };
}

export type BuilderPageState = NonNullable<ReturnType<typeof useBuilderPage>>;
