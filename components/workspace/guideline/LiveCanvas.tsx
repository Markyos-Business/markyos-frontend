"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { BlockScopeProvider } from "@/components/workspace/BlockRenderer";
import { useGuidelineViewer } from "@/lib/useGuidelineViewer";
import { VaultTemplate } from "./templates/VaultTemplate";
import { DocsTemplate } from "./templates/DocsTemplate";
import { StudioTemplate } from "./templates/StudioTemplate";
import { DeckTemplate } from "./templates/DeckTemplate";
import { ManualTemplate } from "./templates/ManualTemplate";
import { MosaicTemplate } from "./templates/MosaicTemplate";
import { LiveEditProvider } from "./LiveEdit";
import { BrandFonts } from "./BrandFonts";
import { BlockKind, Lang } from "@/lib/types";

/** The block behind a flow id, or null for a derived section. */
function blockIdOf(flowId: string): string | null {
  return flowId.startsWith("block-") ? flowId.slice("block-".length) : null;
}

/**
 * The editing canvas: the real guideline site, rendered from the same hook and
 * the same template components the client loads at /v/<slug>, with the editing
 * provider mounted over it. There is no separate "preview" to drift out of
 * sync, because this *is* the page — what the studio arranges here is literally
 * the component tree the client will open.
 */
export function LiveCanvas({
  slug,
  pageSlug,
  selectedId,
  onSelect,
  lang,
  onLangChange,
  draggingKind = null,
}: {
  slug: string;
  pageSlug?: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /**
   * The element being dragged in from the Elements palette.
   *
   * Passed down rather than read off the drag event, because a page may not
   * call `DataTransfer.getData` until the drop — so the canvas has no way to
   * know whether what is crossing it is a block worth opening a gap for. The
   * palette lives in the builder's left panel, outside this provider, so the
   * page owns the state and both sides read it.
   */
  draggingKind?: BlockKind | null;
  /**
   * The language to render in, when the builder's own view switcher owns it.
   *
   * Left out, the canvas keeps its internal preview language, which is what
   * `/v/<slug>` does. Passed in, it becomes controlled — the builder needs the
   * language in the same place as the breakpoint, because the structural-edit
   * rule depends on both and a control that lived inside the rendered page
   * could not be read by the panels around it.
   */
  lang?: Lang;
  onLangChange?: (lang: Lang) => void;
}) {
  const v = useGuidelineViewer(slug, pageSlug);
  const {
    updateBlock,
    removeBlock,
    duplicateBlock,
    reorderBlocks,
    addBlock,
    setSectionTitle,
    setSectionNote,
    setSectionOrder,
    setSectionStyle,
  } = useApp();

  const allBlocks = v.allBlocks;
  const wsId = v.ws?.id;
  const pageId = v.activePage?.id;
  const previewLang = lang ?? v.previewLang;
  const sectionStyles = v.ws?.sectionStyles;
  /**
   * Deck is a slide presentation with a fixed chapter numbering rather than a
   * page of rearrangeable sections, so it renders no flow. Reporting no flow
   * ids here is what keeps its slides under the per-block controls instead of
   * having them defer to a FlowShell that never renders around them.
   */
  const rendersFlow = v.ws?.guidelineTemplate !== "deck";
  const viewerFlowIds = v.flowIds;
  const flowIds = useMemo(() => (rendersFlow ? viewerFlowIds : []), [rendersFlow, viewerFlowIds]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  // The drop handler reads the ref, not the state: dragstart and drop can land
  // in the same tick, and a state update wouldn't have committed yet.
  const draggingRef = useRef<string | null>(null);
  const beginDrag = useCallback((id: string | null) => {
    draggingRef.current = id;
    setDraggingId(id);
  }, []);

  const [draggingFlowId, setDraggingFlowId] = useState<string | null>(null);
  const draggingFlowRef = useRef<string | null>(null);
  const beginFlowDrag = useCallback((id: string | null) => {
    draggingFlowRef.current = id;
    setDraggingFlowId(id);
  }, []);

  /**
   * Commits a whole-page order.
   *
   * Home mixes derived sections with authored ones, so the order is its own
   * stored list. A custom page has nothing but blocks, and giving it a second
   * ordering mechanism alongside their `order` field would mean two sources of
   * truth that could disagree — so there it is written straight back onto the
   * blocks, and both surfaces still move a section the same way.
   */
  const writeFlow = useCallback(
    (nextIds: string[]) => {
      if (!wsId) return;
      if (pageId) {
        const blockIds = nextIds.map(blockIdOf).filter((id): id is string => !!id);
        reorderBlocks(wsId, blockIds, pageId);
        return;
      }
      setSectionOrder(wsId, nextIds);
    },
    [wsId, pageId, reorderBlocks, setSectionOrder]
  );

  /** The blocks sharing this one's container and column, in render order. */
  const siblingsOf = useCallback(
    (blockId: string) => {
      const block = allBlocks.find((b) => b.id === blockId);
      if (!block) return [];
      return allBlocks
        .filter(
          (b) =>
            (b.parentId ?? null) === (block.parentId ?? null) &&
            (b.columnIndex ?? 0) === (block.columnIndex ?? 0)
        )
        .sort((a, b) => a.order - b.order);
    },
    [allBlocks]
  );

  const editValue = useMemo(
    () => ({
      selectedId,
      select: onSelect,
      draggingKind,
      flowIds,
      moveFlow: (flowId: string, direction: -1 | 1) => {
        const from = flowIds.indexOf(flowId);
        const to = from + direction;
        if (from < 0 || to < 0 || to >= flowIds.length) return;
        const next = [...flowIds];
        [next[from], next[to]] = [next[to], next[from]];
        writeFlow(next);
      },
      draggingFlowId,
      beginFlowDrag,
      dropFlowOn: (targetId: string) => {
        const dragId = draggingFlowRef.current;
        if (!dragId || dragId === targetId) return;
        const from = flowIds.indexOf(dragId);
        const at = flowIds.indexOf(targetId);
        if (from < 0 || at < 0) return;
        // Dropping *downward* onto a section means "put me after it".
        // Re-inserting at the target's post-removal index would otherwise land
        // the section exactly where it started and read as a failed drag.
        const draggingDown = from < at;
        const next = flowIds.filter((id) => id !== dragId);
        const insertAt = next.indexOf(targetId) + (draggingDown ? 1 : 0);
        next.splice(insertAt, 0, dragId);
        writeFlow(next);
        beginFlowDrag(null);
      },
      removeFlow: (flowId: string) => {
        if (!wsId) return;
        const blockId = blockIdOf(flowId);
        if (blockId) {
          removeBlock(wsId, blockId, pageId);
          if (selectedId === flowId) onSelect(null);
          return;
        }
        // A derived section is the brand's own colours, type or logo shown
        // through the site. There is nothing here to delete — only a decision
        // about whether clients see it — so this parks it and leaves the data
        // exactly where it was. Parking is stored as a style rather than in
        // `hiddenSections` so the section stays on the canvas, visibly set
        // aside and one click from coming back, instead of vanishing and
        // being recoverable only from a checklist in the sidebar.
        setSectionStyle(wsId, flowId, { hidden: sectionStyles?.[flowId]?.hidden ? undefined : true });
      },
      duplicateFlow: (flowId: string) => {
        if (!wsId) return;
        const blockId = blockIdOf(flowId);
        if (!blockId) return;
        const copyId = duplicateBlock(wsId, blockId, pageId);
        if (copyId) onSelect(`block-${copyId}`);
      },
      insertAfter: (flowId: string, kind: BlockKind) => {
        if (!wsId) return;
        const afterBlockId = blockIdOf(flowId);
        // Appending puts the new block last in the block list; the page order
        // below then moves it to the gap that was actually clicked, which is
        // the only way to land it between two *derived* sections — they have
        // no block for it to be inserted after.
        const newId = addBlock(wsId, kind, pageId, afterBlockId ? { after: afterBlockId } : undefined);
        const newFlowId = `block-${newId}`;
        const at = flowIds.indexOf(flowId);
        const next = flowIds.filter((id) => id !== newFlowId);
        next.splice(at + 1, 0, newFlowId);
        writeFlow(next);
        onSelect(newFlowId);
      },
      siblingIds: (blockId: string) => siblingsOf(blockId).map((b) => b.id),
      update: (blockId: string, patch: Parameters<typeof updateBlock>[2]) => {
        if (wsId) updateBlock(wsId, blockId, patch, pageId);
      },
      remove: (blockId: string) => {
        if (!wsId) return;
        removeBlock(wsId, blockId, pageId);
        if (selectedId === `block-${blockId}`) onSelect(null);
      },
      move: (blockId: string, direction: -1 | 1) => {
        if (!wsId) return;
        const siblings = siblingsOf(blockId);
        const from = siblings.findIndex((b) => b.id === blockId);
        const to = from + direction;
        if (from < 0 || to < 0 || to >= siblings.length) return;
        // Swap the pair's positions in the flat list of record: everything
        // else keeps its relative order, and the two siblings trade places
        // whether they sit at the page root or inside a column.
        const full = [...allBlocks].sort((a, b) => a.order - b.order);
        const i = full.findIndex((b) => b.id === siblings[from].id);
        const j = full.findIndex((b) => b.id === siblings[to].id);
        [full[i], full[j]] = [full[j], full[i]];
        reorderBlocks(wsId, full.map((b) => b.id), pageId);
      },
      addInColumn: (parentId: string, columnIndex: number) => {
        if (wsId) addBlock(wsId, "text", pageId, { parentId, columnIndex });
      },
      renameSection: (sectionId: string, next: string) => {
        if (!wsId) return;
        // A custom block's section heading *is* that block's title, so renaming
        // it has to write the block rather than an override keyed on a section
        // id that only exists while the block does.
        if (sectionId.startsWith("block-")) {
          const blockId = sectionId.slice("block-".length);
          updateBlock(wsId, blockId, previewLang === "ar" ? { arTitle: next } : { title: next }, pageId);
          return;
        }
        setSectionTitle(wsId, sectionId, previewLang, next);
      },
      setSectionNote: (sectionId: string, next: string) => {
        if (!wsId) return;
        // A custom block already has its own body text; the note only exists
        // for the derived sections, which have nowhere else to put prose.
        if (sectionId.startsWith("block-")) {
          const blockId = sectionId.slice("block-".length);
          updateBlock(wsId, blockId, previewLang === "ar" ? { arText: next } : { text: next }, pageId);
          return;
        }
        setSectionNote(wsId, sectionId, previewLang, next);
      },
      draggingId,
      beginDrag,
      dropOn: (targetId: string) => {
        const dragId = draggingRef.current;
        if (!wsId || !dragId || dragId === targetId) return;
        const dragged = allBlocks.find((b) => b.id === dragId);
        const target = allBlocks.find((b) => b.id === targetId);
        if (!dragged || !target) return;
        // A container can't be dropped inside itself.
        if (target.parentId === dragged.id) return;

        const movedScope =
          (dragged.parentId ?? null) !== (target.parentId ?? null) ||
          (dragged.columnIndex ?? 0) !== (target.columnIndex ?? 0);
        if (movedScope) {
          updateBlock(wsId, dragged.id, { parentId: target.parentId, columnIndex: target.columnIndex }, pageId);
        }

        // Pull the dragged id out of the flat order and reinsert it relative
        // to the target. Direction matters: dragging *down* onto a block means
        // "put me after it" — inserting at the target's post-removal index
        // would otherwise land it exactly where it started and look like a
        // no-op drag.
        const sorted = [...allBlocks].sort((a, b) => a.order - b.order).map((b) => b.id);
        const draggingDown = sorted.indexOf(dragged.id) < sorted.indexOf(target.id);
        const ids = sorted.filter((id) => id !== dragged.id);
        const at = ids.indexOf(target.id);
        if (at < 0) return;
        ids.splice(draggingDown ? at + 1 : at, 0, dragged.id);
        reorderBlocks(wsId, ids, pageId);
        beginDrag(null);
      },
    }),
    [
      selectedId,
      onSelect,
      draggingKind,
      siblingsOf,
      allBlocks,
      wsId,
      pageId,
      previewLang,
      updateBlock,
      removeBlock,
      duplicateBlock,
      reorderBlocks,
      addBlock,
      setSectionTitle,
      setSectionNote,
      draggingId,
      beginDrag,
      flowIds,
      writeFlow,
      draggingFlowId,
      beginFlowDrag,
      setSectionStyle,
      sectionStyles,
    ]
  );

  if (!v.ws || !v.theme) return null;

  const templateProps = {
    ws: v.ws,
    isAr: previewLang === "ar",
    theme: v.theme,
    sections: v.sections,
    activeId: v.activeId,
    scrollTo: v.scrollTo,
    sectionIndex: v.sectionIndex,
    showSection: v.showSection,
    sectionTitle: v.sectionTitle,
    sectionNote: v.sectionNote,
    flow: v.flow,
    statementText: v.statementText,
    attachedSlots: v.attachedSlots,
    photoAssets: v.photoAssets,
    iconAssets: v.iconAssets,
    mockupAssets: v.mockupAssets,
    publishedDepartments: v.publishedDepartments,
    customBlocks: v.customBlocks,
    downloadOpen: v.downloadOpen,
    setDownloadOpen: v.setDownloadOpen,
    previewLang,
    setPreviewLang: onLangChange ?? v.setPreviewLang,
    // The badge is a billing artifact of the published site; showing it on the
    // canvas would just be chrome the studio can't act on while editing.
    showMarkyosBadge: false,
    pages: v.pages,
    activePage: v.activePage,
  };

  return (
    <LiveEditProvider value={editValue}>
      <BlockScopeProvider blocks={allBlocks}>
      <BrandFonts fonts={v.fonts} isAr={previewLang === "ar"}>
      <div onClick={() => onSelect(null)}>
        {v.ws.guidelineTemplate === "docs" ? (
          <DocsTemplate {...templateProps} />
        ) : v.ws.guidelineTemplate === "deck" ? (
          <DeckTemplate {...templateProps} />
        ) : v.ws.guidelineTemplate === "manual" ? (
          <ManualTemplate {...templateProps} />
        ) : v.ws.guidelineTemplate === "mosaic" ? (
          <MosaicTemplate {...templateProps} />
        ) : v.ws.guidelineTemplate === "studio" ? (
          <StudioTemplate {...templateProps} />
        ) : (
          <VaultTemplate {...templateProps} />
        )}
      </div>
      </BrandFonts>
      </BlockScopeProvider>
    </LiveEditProvider>
  );
}
