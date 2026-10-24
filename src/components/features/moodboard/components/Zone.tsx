"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";
import { Card } from "./Card";
import { zoneSpecFor } from "@/components/features/moodboard/model/templates";
import type { Asset, MoodboardItem, MoodboardZone } from "@/types";

/**
 * A band of the board with a declared purpose.
 *
 * Three things make a zone more than a heading:
 *
 *   * It is **typed**, so it can offer an action that only makes sense there —
 *     "propose this palette" belongs under Palette and nowhere else.
 *   * It carries an **instruction card**, which is Milanote's best idea: the
 *     board teaches its own use instead of presenting an empty canvas and the
 *     question the person opened it to answer.
 *   * It shows **ghost placeholders** while empty, so the shape of a finished
 *     zone is visible before anything is in it. They are never stored; the
 *     first real card replaces them.
 */

const ZONE_ICON: Record<string, string> = {
  imagery: "image",
  palette: "palette",
  type: "font",
  texture: "shapes",
  words: "quote-right",
  references: "link",
  unsorted: "inbox",
  custom: "th-large",
};

export type ZoneAction = { label: string; arLabel: string; icon: string; run: () => void; busy?: boolean };

export function Zone({
  zone,
  templateKey,
  assets,
  isAr,
  me,
  action,
  draggingId,
  onDragItem,
  onDropInZone,
  onVote,
  onRemoveItem,
  onEditItem,
  onAdd,
  onDismissInstructions,
  onRename,
  onRemoveZone,
  onSampleColor,
}: {
  zone: MoodboardZone;
  templateKey?: string;
  assets: Map<string, Asset>;
  isAr: boolean;
  me: string;
  /** The one thing this zone type can do with its cards, if anything. */
  action?: ZoneAction;
  draggingId: string | null;
  onDragItem: (id: string | null) => void;
  /** `beforeId` is the card the drop landed above, or null for the end. */
  onDropInZone: (zoneId: string, beforeId: string | null) => void;
  onVote: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onEditItem: (itemId: string, patch: Partial<MoodboardItem>) => void;
  onAdd: (zone: MoodboardZone, kind: MoodboardItem["kind"]) => void;
  onDismissInstructions: () => void;
  onRename: () => void;
  onRemoveZone: () => void;
  onSampleColor: (url: string) => void;
}) {
  const [over, setOver] = useState(false);
  const items = [...zone.items].sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));
  const spec = zoneSpecFor(templateKey, zone.kind, zone.title);
  const placeholders = items.length === 0 ? (spec?.placeholders ?? []) : [];
  const instructions = isAr ? zone.arInstructions : zone.instructions;
  const title = isAr && zone.arTitle ? zone.arTitle : zone.title;

  return (
    <section
      aria-label={title}
      className="flex flex-col gap-3 rounded-2xl p-4"
      style={{
        background: over ? "var(--surface-1)" : "transparent",
        boxShadow: over ? "inset 0 0 0 2px var(--accent)" : "inset 0 0 0 1px var(--hairline)",
      }}
      onDragOver={(e) => {
        if (!draggingId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!over) setOver(true);
      }}
      onDragLeave={(e) => {
        // Only when the pointer actually left the zone, not when it crossed
        // onto a card inside it — otherwise the highlight flickers off under
        // the cursor and the drop target looks like it moved.
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onDropInZone(zone.id, null);
      }}
    >
      <header className="flex items-center gap-2">
        <Icon name={ZONE_ICON[zone.kind] ?? "th-large"} size={13} style={{ color: "var(--text-faint)" }} />
        <h2 dir="auto" className="bidi-auto text-[13px] font-semibold">{title}</h2>
        <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
          {items.length > 0 ? items.length : ""}
        </span>

        <span className="ms-auto flex items-center gap-1.5">
          {action && (
            <button
              type="button"
              onClick={action.run}
              disabled={action.busy || items.length === 0}
              className="mk-tap h-7 px-3 rounded-full text-[11px] font-semibold cursor-pointer flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "var(--accent-soft)", color: "var(--accent-on-soft)" }}
            >
              <Icon name={action.icon} size={11} />
              {isAr ? action.arLabel : action.label}
            </button>
          )}
          <AddMenu zone={zone} isAr={isAr} onAdd={onAdd} />
          <button
            type="button"
            onClick={onRename}
            aria-label={isAr ? `أعد تسمية ${title}` : `Rename ${title}`}
            className="mk-icon-btn cursor-pointer"
          >
            <Icon name="pen" size={11} style={{ color: "var(--text-faint)" }} />
          </button>
          {/* The tray is not a zone anyone should be able to delete: it is
              where a card goes when its zone is removed, so removing it would
              leave the next deletion with nowhere to put things. */}
          {zone.kind !== "unsorted" && (
            <button
              type="button"
              onClick={onRemoveZone}
              aria-label={isAr ? `احذف قسم ${title}` : `Delete the ${title} zone`}
              className="mk-icon-btn mk-danger-hover cursor-pointer"
            >
              <Icon name="trash" size={11} style={{ color: "var(--text-faint)" }} />
            </button>
          )}
        </span>
      </header>

      {instructions && !zone.instructionsDismissed && (
        <div
          className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
          style={{ background: "var(--surface-1)" }}
        >
          <Icon name="info-circle" size={13} style={{ color: "var(--text-faint)", flexShrink: 0, marginTop: 2 }} />
          <p dir="auto" className="bidi-auto flex-1 text-[12px] leading-[1.5]" style={{ color: "var(--text-muted)" }}>
            {instructions}
          </p>
          <button
            type="button"
            onClick={onDismissInstructions}
            aria-label={isAr ? "أخفِ هذه الإرشادات" : "Hide these instructions"}
            className="mk-icon-btn cursor-pointer shrink-0"
          >
            <Icon name="times" size={11} style={{ color: "var(--text-faint)" }} />
          </button>
        </div>
      )}

      {/*
        A grid rather than CSS columns.

        Columns balance beautifully and get the reading order wrong: the DOM
        order runs down one column and back up the next, which is the order a
        screen reader announces and the order the keyboard walks. A grid keeps
        DOM order, reading order and visual order the same thing, and mirrors
        in Arabic for free.
      */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-start">
        {items.map((item) => (
          <div
            key={item.id}
            onDragOver={(e) => {
              if (!draggingId || draggingId === item.id) return;
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOver(false);
              onDropInZone(zone.id, item.id);
            }}
            style={{ gridColumn: item.size === "l" ? "span 2" : "span 1" }}
          >
            <Card
              item={item}
              asset={item.assetId ? assets.get(item.assetId) : undefined}
              isAr={isAr}
              me={me}
              dragging={draggingId === item.id}
              onVote={() => onVote(item.id)}
              onRemove={() => onRemoveItem(item.id)}
              onEdit={(patch) => onEditItem(item.id, patch)}
              onDragStart={() => onDragItem(item.id)}
              onDragEnd={() => onDragItem(null)}
              onSampleColor={item.kind === "asset" ? onSampleColor : undefined}
            />
          </div>
        ))}

        {placeholders.map((ghost, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onAdd(zone, ghost.kind)}
            className="rounded-xl grid place-items-center gap-1.5 cursor-pointer p-4"
            style={{
              gridColumn: ghost.size === "l" ? "span 2" : "span 1",
              minHeight: 104,
              color: "var(--text-faint)",
              boxShadow: "inset 0 0 0 1px var(--hairline-strong)",
            }}
          >
            <Icon name="plus" size={13} />
            <span dir="auto" className="bidi-auto text-[11.5px] text-center">
              {isAr ? ghost.arHint : ghost.hint}
            </span>
          </button>
        ))}

        {items.length === 0 && placeholders.length === 0 && (
          <p className="text-[11.5px] col-span-full py-3" style={{ color: "var(--text-faint)" }}>
            {isAr ? "لا شيء هنا بعد." : "Nothing here yet."}
          </p>
        )}
      </div>
    </section>
  );
}

/** What can go in this zone. Offered in the order the zone's job suggests. */
function AddMenu({
  zone,
  isAr,
  onAdd,
}: {
  zone: MoodboardZone;
  isAr: boolean;
  onAdd: (zone: MoodboardZone, kind: MoodboardItem["kind"]) => void;
}) {
  const [open, setOpen] = useState(false);

  const KINDS: Array<{ kind: MoodboardItem["kind"]; label: string; arLabel: string; icon: string }> = [
    { kind: "asset", label: "Image", arLabel: "صورة", icon: "image" },
    { kind: "swatch", label: "Colour", arLabel: "لون", icon: "swatchbook" },
    { kind: "note", label: "Note", arLabel: "ملاحظة", icon: "sticky-note" },
    { kind: "link", label: "Link", arLabel: "رابط", icon: "link" },
    { kind: "font", label: "Typeface", arLabel: "خط", icon: "font" },
  ];

  // The zone's own kind first: under Palette, "Colour" should be the first
  // thing offered, not the second.
  const preferred: Record<string, MoodboardItem["kind"]> = {
    palette: "swatch",
    words: "note",
    references: "link",
    type: "font",
  };
  const first = preferred[zone.kind];
  const ordered = first ? [...KINDS].sort((a, b) => (a.kind === first ? -1 : b.kind === first ? 1 : 0)) : KINDS;

  return (
    <span className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={isAr ? "أضف بطاقة" : "Add a card"}
        className="mk-icon-btn cursor-pointer"
      >
        <Icon name="plus" size={12} style={{ color: "var(--text-faint)" }} />
      </button>
      {open && (
        <>
          {/* A click anywhere else closes it. Without this the menu stays open
              behind whatever the person does next. */}
          <span className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <span
            // Animated in, like every other menu in the app. A panel that
            // simply exists on the next frame gives no clue where it came
            // from, which is the one thing an entrance is for.
            className="absolute z-20 flex flex-col rounded-xl overflow-hidden py-1 animate-fade-in"
            style={{
              insetInlineEnd: 0,
              top: "calc(100% + 4px)",
              minWidth: 150,
              background: "var(--surface-2)",
              boxShadow: "0 0 0 1px var(--hairline-strong), var(--shadow-pop)",
            }}
          >
            {ordered.map((k) => (
              <button
                key={k.kind}
                type="button"
                onClick={() => {
                  onAdd(zone, k.kind);
                  setOpen(false);
                }}
                className="flex items-center gap-2.5 h-8 px-3 text-[12px] cursor-pointer text-start"
                style={{ color: "var(--text)" }}
              >
                <Icon name={k.icon} size={12} style={{ color: "var(--text-faint)" }} />
                {isAr ? k.arLabel : k.label}
              </button>
            ))}
          </span>
        </>
      )}
    </span>
  );
}
