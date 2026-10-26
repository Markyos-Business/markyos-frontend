"use client";

import { useMemo, useState } from "react";
import { EmptyHint, Icon } from "@/components/ui";
import { ALL_BLOCK_KINDS, BLOCK_DRAG_TYPE, BLOCK_META, CATEGORY_META, CATEGORY_ORDER } from "@/components/features/guideline-site";
import type { BlockKind } from "@/types";

type ElementsTabProps = {
  isAr: boolean;
  onAdd: (kind: BlockKind) => void;
  onDraggingKind: (kind: BlockKind | null) => void;
};

/** The element palette: searchable, grouped by category, each clickable or draggable onto the page. */
export function ElementsTab({ isAr, onAdd, onDraggingKind }: ElementsTabProps) {
  const [query, setQuery] = useState("");
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

  return (
    <>
      <label className="flex h-9 items-center gap-2 rounded-full bg-surface-1 px-3">
        <Icon name="search" size={13} className="text-text-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isAr ? "بحث..." : "Search..."}
          className="flex-1 bg-transparent text-[12px] text-text outline-none"
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
                <Icon name={CATEGORY_META[cat].icon} size={12} className="text-text-faint" />
                <span className="text-[10.5px] font-semibold tracking-[0.08em] text-text-faint uppercase">
                  {isAr ? CATEGORY_META[cat].arLabel : CATEGORY_META[cat].label}
                </span>
              </div>
              {kinds.map((kind) => {
                const meta = BLOCK_META[kind];
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => onAdd(kind)}
                    /*
                     * Draggable as well as clickable, and both do something
                     * different on purpose: a click appends below whatever is
                     * selected, a drag puts it exactly where it is dropped.
                     */
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "copy";
                      e.dataTransfer.setData(BLOCK_DRAG_TYPE, kind);
                      // Firefox refuses to start a drag with no text/plain
                      // payload, whatever else is set.
                      e.dataTransfer.setData("text/plain", meta.label);
                      onDraggingKind(kind);
                    }}
                    onDragEnd={() => onDraggingKind(null)}
                    title={isAr ? "اضغط للإضافة، أو اسحب إلى المكان الذي تريده" : "Click to add below the selection, or drag it onto the page"}
                    className="mk-card flex cursor-grab items-start gap-2.5 rounded-xl bg-surface-1 p-2.5 text-start active:cursor-grabbing"
                  >
                    <Icon name={meta.icon} size={16} className="mt-0.5 shrink-0 text-accent-text" />
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-medium">{isAr ? meta.arLabel : meta.label}</div>
                      <div className="mt-0.5 text-[11px] text-text-faint">{isAr ? meta.arHint : meta.hint}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })
      )}
    </>
  );
}
