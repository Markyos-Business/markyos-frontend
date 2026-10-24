"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";
import { BLOCK_META } from "@/components/features/guideline-site";
import type { BlockStyle, PageBlock } from "@/types";

/**
 * The page as a list of its parts.
 *
 * The canvas answers "what does this look like"; it is a poor answer to "what
 * is on this page and in what order", because a section can be taller than the
 * viewport and a parked one looks much like a present one. Every editor of this
 * shape has a layers tree for the same reason, and this builder has been
 * missing it — reordering meant dragging a full-height section past other
 * full-height sections while the canvas scrolled underneath.
 *
 * Reordering here is buttons as well as dragging. Drag-and-drop alone is a
 * feature keyboard and switch users do not have — and, until this file grew the
 * handlers below, the dragging half was a claim rather than a feature: the state
 * for it was here, threaded through both components, and not one `draggable`
 * attribute or drop handler existed. It read as finished from the outside, which
 * is the only kind of missing feature that never gets reported.
 */

export type Layer = {
  /** A flow id: `block-<id>` for an authored section, or the derived id. */
  id: string;
  label: string;
  icon: string;
  /** Derived sections are built from brand data and cannot be deleted. */
  kind: "fixed" | "block";
  style?: BlockStyle;
  /** Nested blocks, for a layout container. */
  children?: Layer[];
};

/**
 * A glyph per kind of section.
 *
 * A column of sixteen identical icons carries no information — it is decoration
 * with the cost of decoration and none of the benefit, and it makes the list
 * something you read rather than something you scan. Distinct marks turn
 * finding the colour section into recognition instead of recall, which is the
 * whole point of having icons in a list at all.
 *
 * Every name here has to exist in `tailwind/icons.js`: it is an offline stand-in
 * for Line Awesome, and a glyph it does not define renders as a solid square.
 */
const SECTION_ICON: Record<string, string> = {
  overview: "book",
  statement: "quote-right",
  strategy: "bullseye",
  logo: "shapes",
  misuse: "exclamation-circle",
  "app-icon": "mobile",
  color: "palette",
  typography: "font",
  mockups: "image",
  photography: "image",
  patterns: "th-large",
  icons: "star",
  social: "share-square",
  personas: "users",
  voice: "quote-right",
  departments: "sitemap",
};

/** Builds the tree from the flow, folding a container's children underneath it. */
export function buildLayers(
  flowIds: string[],
  blocksById: Map<string, PageBlock>,
  allBlocks: PageBlock[],
  labelFor: (flowId: string) => string,
  sectionStyles: Record<string, BlockStyle | undefined>,
): Layer[] {
  const childrenOf = (parentId: string): Layer[] =>
    allBlocks
      .filter((b) => b.parentId === parentId)
      .sort((a, b) => (a.columnIndex ?? 0) - (b.columnIndex ?? 0) || a.order - b.order)
      .map((b) => ({
        id: `block-${b.id}`,
        label: b.title?.trim() || BLOCK_META[b.kind].label,
        icon: BLOCK_META[b.kind].icon,
        kind: "block" as const,
        style: b.style,
        children: childrenOf(b.id),
      }));

  return flowIds.map((flowId) => {
    const block = blocksById.get(flowId);
    if (!block) {
      return {
        id: flowId,
        label: labelFor(flowId),
        icon: SECTION_ICON[flowId] ?? "layer-group",
        kind: "fixed" as const,
        style: sectionStyles[flowId],
      };
    }
    return {
      id: flowId,
      label: block.title?.trim() || BLOCK_META[block.kind].label,
      icon: BLOCK_META[block.kind].icon,
      kind: "block" as const,
      style: block.style,
      children: childrenOf(block.id),
    };
  });
}

export function LayersPanel({
  layers,
  selectedId,
  onSelect,
  onMove,
  onReorder,
  onToggleHidden,
  isAr,
}: {
  layers: Layer[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Reorders a top-level section. Nested blocks move on the canvas. */
  onMove: (id: string, direction: -1 | 1) => void;
  /** Drops one top-level section above or below another. */
  onReorder: (dragId: string, targetId: string, before: boolean) => void;
  onToggleHidden: (layer: Layer) => void;
  isAr: boolean;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  /** The row the pointer is over, and which half of it. */
  const [dropAt, setDropAt] = useState<{ id: string; before: boolean } | null>(null);

  if (layers.length === 0) {
    return (
      <p className="text-[11.5px] px-1 py-2" style={{ color: "var(--text-faint)" }}>
        {isAr
          ? "لا توجد أقسام على هذه الصفحة بعد. أضف واحدًا من تبويب «إضافة»."
          : "Nothing on this page yet. Add a section from the Insert tab."}
      </p>
    );
  }

  return (
    <div
      className="flex flex-col gap-0.5"
      role="tree"
      aria-label={isAr ? "طبقات الصفحة" : "Page layers"}
      // Dropping anywhere in the tree ends the drag, including on the gaps
      // between rows. Without this a drop that lands one pixel off a row leaves
      // the indicator painted and the tree looking stuck mid-drag.
      onDragEnd={() => {
        setDragId(null);
        setDropAt(null);
      }}
    >
      {layers.map((layer, index) => (
        <LayerRow
          key={layer.id}
          layer={layer}
          depth={0}
          index={index}
          count={layers.length}
          selectedId={selectedId}
          onSelect={onSelect}
          onMove={onMove}
          onToggleHidden={onToggleHidden}
          isAr={isAr}
          dragId={dragId}
          setDragId={setDragId}
          dropAt={dropAt}
          setDropAt={setDropAt}
          onReorder={onReorder}
        />
      ))}
    </div>
  );
}

function LayerRow({
  layer,
  depth,
  index,
  count,
  selectedId,
  onSelect,
  onMove,
  onToggleHidden,
  isAr,
  dragId,
  setDragId,
  dropAt,
  setDropAt,
  onReorder,
}: {
  layer: Layer;
  depth: number;
  index: number;
  count: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onToggleHidden: (layer: Layer) => void;
  isAr: boolean;
  dragId: string | null;
  setDragId: (id: string | null) => void;
  dropAt: { id: string; before: boolean } | null;
  setDropAt: (at: { id: string; before: boolean } | null) => void;
  onReorder: (dragId: string, targetId: string, before: boolean) => void;
}) {
  const active = selectedId === layer.id;
  /**
   * Only top-level sections reorder here.
   *
   * A block nested inside a layout container reorders within its column, which
   * is a different operation with a different target list — and the same
   * restriction the move-up/move-down buttons on this row already carry. A drag
   * that silently did nothing for nested rows would be worse than one that
   * never starts.
   */
  const reorderable = depth === 0;
  const isDropTarget = dropAt?.id === layer.id && dragId !== null && dragId !== layer.id;
  const parked = layer.style?.hidden === true;
  /** Hidden at a narrower width only — a real state, and easy to forget. */
  const narrowOnly =
    !parked && (layer.style?.bp?.phone?.hidden === true || layer.style?.bp?.tablet?.hidden === true);
  const children = layer.children ?? [];

  return (
    <>
      <div
        role="treeitem"
        aria-selected={active}
        aria-level={depth + 1}
        draggable={reorderable}
        className="group flex items-center gap-1.5 h-8 rounded-lg pe-1 cursor-pointer"
        style={{
          // Indentation is inline-start padding, so the tree nests toward the
          // start of the line in both directions rather than always leftward.
          paddingInlineStart: 8 + depth * 14,
          background: active ? "var(--accent-soft)" : dragId === layer.id ? "var(--surface-2)" : "transparent",
          color: active ? "var(--accent-on-soft)" : parked ? "var(--text-faint)" : "var(--text-muted)",
          opacity: dragId === layer.id ? 0.45 : 1,
          /* The landing line, on the edge the drop will insert at. An outline
             around the whole row would say "into this one", which is a
             different and impossible operation here. */
          boxShadow: isDropTarget
            ? dropAt.before
              ? "inset 0 2px 0 0 var(--accent)"
              : "inset 0 -2px 0 0 var(--accent)"
            : undefined,
        }}
        onClick={() => onSelect(active ? null : layer.id)}
        onDragStart={(e) => {
          if (!reorderable) return;
          e.dataTransfer.effectAllowed = "move";
          // A payload is required for Firefox to start a drag at all, and
          // "text/plain" is the one type every browser accepts.
          e.dataTransfer.setData("text/plain", layer.id);
          setDragId(layer.id);
        }}
        onDragEnd={() => {
          setDragId(null);
          setDropAt(null);
        }}
        onDragOver={(e) => {
          if (!reorderable || !dragId || dragId === layer.id) return;
          // preventDefault unconditionally, or the browser never fires `drop`.
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          const box = e.currentTarget.getBoundingClientRect();
          const before = e.clientY < box.top + box.height / 2;
          if (dropAt?.id !== layer.id || dropAt.before !== before) setDropAt({ id: layer.id, before });
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          if (dropAt?.id === layer.id) setDropAt(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (dragId && dropAt?.id === layer.id) onReorder(dragId, layer.id, dropAt.before);
          setDragId(null);
          setDropAt(null);
        }}
      >
        {/* The grip is what says this row can be picked up. The row itself is
            draggable, so this is a signpost rather than a control — which is
            why it is not in the tab order: the move buttons beside it are the
            keyboard's way of doing the same thing. */}
        {reorderable && (
          <span
            aria-hidden
            className="opacity-0 group-hover:opacity-100 shrink-0 -ms-1"
            style={{ cursor: "grab", color: "var(--text-faint)" }}
          >
            <Icon name="grip-vertical" size={10} />
          </span>
        )}
        <Icon name={layer.icon} size={12} style={{ flexShrink: 0, opacity: parked ? 0.6 : 1 }} />
        {/* A tree row is one line by definition, so this label truncates — but
            it carries the full string in a title, because a name ellipsed to
            "Print & merchandi…" is a section you have to click to identify. */}
        <span
          dir="auto"
          title={layer.label}
          className="bidi-auto flex-1 min-w-0 truncate text-[12px]"
          style={{ textDecoration: parked ? "line-through" : undefined }}
        >
          {layer.label}
        </span>

        {narrowOnly && (
          <span
            title={isAr ? "مخفي في عرض أضيق" : "Hidden at a narrower width"}
            aria-label={isAr ? "مخفي في عرض أضيق" : "Hidden at a narrower width"}
            className="shrink-0 grid place-items-center"
            style={{ color: "var(--text-faint)" }}
          >
            <Icon name="mobile" size={11} />
          </span>
        )}

        {/* The row's own controls. Kept out of the tab order until the row is
            focused or hovered would hide them from keyboard users entirely, so
            they are always focusable and only visually quiet. */}
        <span className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100">
          <RowButton
            icon="angle-up"
            label={isAr ? `نقل ${layer.label} لأعلى` : `Move ${layer.label} up`}
            disabled={depth > 0 || index === 0}
            onClick={() => onMove(layer.id, -1)}
          />
          <RowButton
            icon="angle-down"
            label={isAr ? `نقل ${layer.label} لأسفل` : `Move ${layer.label} down`}
            disabled={depth > 0 || index === count - 1}
            onClick={() => onMove(layer.id, 1)}
          />
          <RowButton
            icon={parked ? "eye-slash" : "eye"}
            label={
              parked
                ? isAr ? `إظهار ${layer.label}` : `Show ${layer.label}`
                : isAr ? `إخفاء ${layer.label}` : `Hide ${layer.label}`
            }
            onClick={() => onToggleHidden(layer)}
          />
        </span>
      </div>

      {children.map((child, i) => (
        <LayerRow
          key={child.id}
          layer={child}
          depth={depth + 1}
          index={i}
          count={children.length}
          selectedId={selectedId}
          onSelect={onSelect}
          onMove={onMove}
          onToggleHidden={onToggleHidden}
          isAr={isAr}
          dragId={dragId}
          setDragId={setDragId}
          dropAt={dropAt}
          setDropAt={setDropAt}
          onReorder={onReorder}
        />
      ))}
    </>
  );
}

function RowButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="h-6 w-6 grid place-items-center rounded cursor-pointer disabled:cursor-not-allowed disabled:opacity-25"
      style={{ color: "inherit" }}
    >
      <Icon name={icon} size={11} />
    </button>
  );
}
