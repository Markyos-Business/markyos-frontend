"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useBrandPage } from "@/contexts/pageGuards";
import { useDialog, useToast } from "@/components/ui";
import { scopeForView } from "@/lib/doc/core/rules";
import type { Breakpoint, ViewContext } from "@/lib/doc/core/types";
import { useLocalPref } from "@/hooks/useLocalPref";
import type { BlockKind, BlockStyle, GuidelineTemplate, Lang, StudioStyle } from "@/types";
import { reviewPage } from "../model/pageReview";
import { PANEL_W, type ToolTab } from "../constants";
import { STUDIO_STYLE_META, STYLE_META, type Template } from "../templates";
import { useBuilderPanels } from "./useBuilderPanels";

/**
 * The guidelines editor: which page and section are selected, which view the
 * canvas shows, the page review, keyboard control, and every action the
 * editor's panels offer.
 */
export function useBuilderPage(slug: string) {
  const {
    addBlock,
    updateBlock,
    addTemplateBlocks,
    publishGuideline,
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
  const { leftOpen, rightOpen, setLeftOpen, setRightOpen } = useBuilderPanels();

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
