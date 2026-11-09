"use client";

import { useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { useGuidelineViewer } from "@/components/features/guideline-site";
import { buildLayers, LayersPanel } from "./LayersPanel";
import type { Layer } from "./LayersPanel";
import type { Lang, Workspace } from "@/types";

/**
 * The layers tree, wired to the page it is showing.
 *
 * It reads the flow through the same hook the canvas does, so the order in the
 * tree is the order on the page by construction rather than by two lists being
 * kept in step. Reordering writes back through the same two paths the canvas
 * uses — `setSectionOrder` on Home, where derived sections and authored ones
 * are interleaved, and `reorderBlocks` on a custom page, which has nothing but
 * blocks and would otherwise end up with two orderings that could disagree.
 */
export function LayersTab({
  ws,
  pageSlug,
  lang,
  selectedId,
  onSelect,
  isAr,
}: {
  ws: Workspace;
  pageSlug?: string;
  lang: Lang;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  isAr: boolean;
}) {
  const { reorderBlocks, setSectionOrder, setSectionStyle, setBlockStyle } = useApp();
  const v = useGuidelineViewer(ws.slug, pageSlug);
  const pageId = v.activePage?.id;

  const layers = useMemo(() => {
    const blocksById = new Map(v.customBlocks.map((b) => [`block-${b.id}`, b]));
    const labels = new Map(v.availableFixed.map((s) => [s.id, isAr || lang === "ar" ? s.arLabel : s.label]));
    return buildLayers(
      v.flowIds,
      blocksById,
      v.allBlocks,
      (flowId) => labels.get(flowId) ?? flowId,
      ws.sectionStyles,
    );
  }, [v.flowIds, v.customBlocks, v.allBlocks, v.availableFixed, ws.sectionStyles, isAr, lang]);

  function move(id: string, direction: -1 | 1) {
    const from = v.flowIds.indexOf(id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= v.flowIds.length) return;
    const next = [...v.flowIds];
    [next[from], next[to]] = [next[to], next[from]];
    if (pageId) {
      reorderBlocks(
        ws.id,
        next.map((f) => (f.startsWith("block-") ? f.slice("block-".length) : f)),
        pageId,
      );
      return;
    }
    setSectionOrder(ws.id, next);
  }

  /**
   * Drops `dragId` above or below `targetId`.
   *
   * Written as "which side of the target" rather than "which index", because an
   * index is only meaningful before the dragged row is removed and the whole
   * point is that it is removed first. The pull-then-insert order here is the
   * same one the canvas uses, so the two surfaces cannot disagree about where a
   * drop lands.
   */
  function reorder(dragId: string, targetId: string, before: boolean) {
    if (dragId === targetId) return;
    const next = v.flowIds.filter((id) => id !== dragId);
    const at = next.indexOf(targetId);
    if (at < 0) return;
    next.splice(before ? at : at + 1, 0, dragId);
    if (pageId) {
      reorderBlocks(
        ws.id,
        next.map((f) => (f.startsWith("block-") ? f.slice("block-".length) : f)),
        pageId,
      );
      return;
    }
    setSectionOrder(ws.id, next);
  }

  function toggleHidden(layer: Layer) {
    const hidden = layer.style?.hidden === true ? undefined : true;
    if (layer.kind === "block") {
      setBlockStyle(ws.id, layer.id.slice("block-".length), { hidden }, pageId);
      return;
    }
    // A derived section has no block to throw away — its content is the
    // brand's own colours or type — so it is parked rather than deleted.
    setSectionStyle(ws.id, layer.id, { hidden });
  }

  return (
    <LayersPanel
      layers={layers}
      selectedId={selectedId}
      onSelect={onSelect}
      onMove={move}
      onReorder={reorder}
      onToggleHidden={toggleHidden}
      isAr={isAr}
    />
  );
}
