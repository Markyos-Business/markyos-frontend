"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";
import { contrastRatio } from "@/lib/contrast";
import type { Asset, MoodboardItem } from "@/types";

/**
 * One card on a board.
 *
 * Five kinds, one frame. The frame is deliberately quiet — `surface-1`, a
 * hairline, no accent — because on a moodboard the *content* carries the
 * colour and any chrome with an opinion of its own competes with the thing
 * being judged. That is the one visual rule this page has.
 */

export type CardProps = {
  item: MoodboardItem;
  asset?: Asset;
  isAr: boolean;
  /** The person reading, so the vote button can say whether it is theirs. */
  me: string;
  onVote: () => void;
  onRemove: () => void;
  onEdit: (patch: Partial<MoodboardItem>) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onSampleColor?: (hex: string) => void;
  dragging: boolean;
};

const SPAN: Record<MoodboardItem["size"], string> = {
  s: "span 1",
  m: "span 1",
  l: "span 2",
};

/**
 * What a card *shows*, with no frame and no chrome.
 *
 * Split out because the same five kinds are drawn in two places that want
 * completely different manners around them: the column view frames each one
 * with a caption bar and an HTML5 drag handle, and the canvas frames it with a
 * resize corner and a connection port. Sharing the frame between them would
 * have meant a component with two modes; sharing only the content means each
 * surface owns its own interaction and neither has to know about the other.
 */
export function CardBody(props: {
  item: MoodboardItem;
  asset?: Asset;
  isAr: boolean;
  onEdit: (patch: Partial<MoodboardItem>) => void;
  onSampleColor?: (hex: string) => void;
  /** Fill the frame rather than sitting at the image's natural height. */
  fill?: boolean;
}) {
  return <Body {...props} />;
}

export function Card(props: CardProps) {
  const { item, dragging, onDragStart, onDragEnd } = props;
  const [armed, setArmed] = useState(false);

  return (
    <figure
      // The card spans columns by size. `l` is two columns wide, which is what
      // makes a board look like a board rather than a uniform contact sheet.
      style={{ gridColumn: SPAN[item.size], opacity: dragging ? 0.4 : 1 }}
      className="group relative rounded-xl overflow-hidden flex flex-col"
      draggable={armed}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", item.id);
        onDragStart();
      }}
      onDragEnd={() => {
        setArmed(false);
        onDragEnd();
      }}
    >
      <div
        className="flex-1 min-h-0"
        style={{ background: "var(--surface-1)", boxShadow: "inset 0 0 0 1px var(--hairline-strong)" }}
      >
        <Body {...props} />
      </div>
      <Footer {...props} onArm={setArmed} />
    </figure>
  );
}

function Body({
  item,
  asset,
  isAr,
  onEdit,
  onSampleColor,
  fill,
}: {
  item: MoodboardItem;
  asset?: Asset;
  isAr: boolean;
  onEdit: (patch: Partial<MoodboardItem>) => void;
  onSampleColor?: (hex: string) => void;
  fill?: boolean;
}) {
  switch (item.kind) {
    case "asset":
      if (!asset) {
        return (
          <div className="p-3 text-[11.5px]" style={{ color: "var(--text-faint)" }}>
            {isAr ? "الملف لم يعد موجودًا." : "This file is no longer in brand files."}
          </div>
        );
      }
      return (
        <div className="relative" style={fill ? { height: "100%" } : undefined}>
          {/* A reference photograph, not brand artwork: it brings its own
              ground, so it is drawn exactly as uploaded. `cover` on the canvas,
              where the card has a size somebody chose and the picture has to
              fill it; natural height in the column view, where the masonry is
              what gives the board its rhythm. */}
          {/*
            `draggable={false}` is load-bearing, not tidiness.

            An `<img>` is natively draggable, so a press-and-move starting on one
            makes the browser take over the pointer and begin its own image drag
            — which fires `pointercancel` and abandons whatever gesture was in
            progress. On the canvas that meant a card could be picked up and then
            silently dropped one frame later, with no error and nothing stored.
            The card's own drag is the figure's, in both views.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset.url}
            alt={asset.fileName}
            loading="lazy"
            draggable={false}
            style={
              fill
                ? { width: "100%", height: "100%", objectFit: "cover", display: "block" }
                : { width: "100%", display: "block" }
            }
          />
          {onSampleColor && (
            <button
              type="button"
              onClick={() => onSampleColor(asset.url)}
              title={isAr ? "استخرج الألوان من هذه الصورة" : "Read the colours out of this image"}
              aria-label={isAr ? "استخرج الألوان من هذه الصورة" : "Read the colours out of this image"}
              className="absolute top-2 h-7 w-7 rounded-full grid place-items-center cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
              style={{ insetInlineEnd: 8, background: "rgba(0,0,0,.62)", color: "#fff" }}
            >
              <Icon name="eye-dropper" size={12} />
            </button>
          )}
        </div>
      );

    case "swatch":
      return <Swatch item={item} isAr={isAr} onEdit={onEdit} fill={fill} />;

    case "note":
      return <Note item={item} isAr={isAr} onEdit={onEdit} fill={fill} />;

    case "link":
      return <LinkCard item={item} asset={asset} isAr={isAr} fill={fill} />;

    case "font":
      return <FontCard item={item} asset={asset} isAr={isAr} />;
  }
}

function Swatch({
  item,
  isAr,
  onEdit,
  fill,
}: {
  item: MoodboardItem;
  isAr: boolean;
  onEdit: (patch: Partial<MoodboardItem>) => void;
  fill?: boolean;
}) {
  const hex = item.hex ?? "#888888";
  // The label sits on the colour, so it has to be solved against it rather
  // than inheriting the page's ink — which is how a white hex code ends up
  // invisible on a pale swatch.
  const onWhite = contrastRatio("#ffffff", hex) ?? 1;
  const onBlack = contrastRatio("#111111", hex) ?? 1;
  const ink = onWhite >= onBlack ? "#ffffff" : "#111111";

  return (
    <div className="flex flex-col" style={fill ? { height: "100%" } : undefined}>
      <div className="relative" style={{ background: hex, height: fill ? "100%" : 92, minHeight: 60 }}>
        {/*
          A corner control, not a label covering the whole swatch.

          The full-face version meant the card's own face belonged to a colour
          input, so on the canvas there was nowhere left to pick the card up
          from — a swatch could only be moved by a grip that appeared on hover,
          which is not how anyone expects to move a square of colour. The ink is
          solved against the swatch, like the hex code beside it.
        */}
        <label
          className="mk-icon-btn absolute top-1.5 cursor-pointer"
          style={{ insetInlineEnd: 6, color: ink }}
          title={isAr ? "غيّر اللون" : "Change the colour"}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Icon name="eye-dropper" size={11} />
          <input
            type="color"
            value={hex}
            onChange={(e) => onEdit({ hex: e.target.value })}
            className="sr-only"
            aria-label={isAr ? "لون البطاقة" : "Card colour"}
          />
        </label>
        <span
          dir="ltr"
          className="absolute bottom-2 text-[11px] font-semibold pointer-events-none bidi-auto"
          style={{ insetInlineStart: 10, color: ink, fontFamily: "ui-monospace, Menlo, monospace" }}
        >
          {hex.toUpperCase()}
        </span>
      </div>
      <input
        value={item.name ?? ""}
        onChange={(e) => onEdit({ name: e.target.value })}
        placeholder={isAr ? "اسم اللون" : "Name this colour"}
        dir="auto"
        aria-label={isAr ? "اسم اللون" : "Colour name"}
        onPointerDown={(e) => e.stopPropagation()}
        className="bidi-auto h-8 px-2.5 bg-transparent outline-none text-[11.5px] shrink-0"
        style={{ color: "var(--text-muted)" }}
      />
    </div>
  );
}

function Note({
  item,
  isAr,
  onEdit,
  fill,
}: {
  item: MoodboardItem;
  isAr: boolean;
  onEdit: (patch: Partial<MoodboardItem>) => void;
  fill?: boolean;
}) {
  return (
    <textarea
      value={item.note ?? ""}
      onChange={(e) => onEdit({ note: e.target.value })}
      placeholder={isAr ? "اكتب فكرة…" : "Write a thought…"}
      rows={4}
      dir="auto"
      aria-label={isAr ? "نص الملاحظة" : "Note text"}
      className="bidi-auto w-full bg-transparent outline-none resize-none px-3 py-2.5 text-[12.5px] leading-[1.5]"
      style={{ color: "var(--text)", minHeight: 96, height: fill ? "100%" : undefined }}
    />
  );
}

function LinkCard({
  item,
  asset,
  isAr,
  fill,
}: {
  item: MoodboardItem;
  asset?: Asset;
  isAr: boolean;
  fill?: boolean;
}) {
  let host = item.url ?? "";
  try {
    host = new URL(item.url ?? "").hostname.replace(/^www\./, "");
  } catch {
    // Not a parseable URL — show what was pasted rather than an empty card.
  }

  /*
   * On the canvas the face belongs to the card, not to the link.
   *
   * A whole-card anchor and a whole-card drag handle are the same rectangle,
   * and the browser resolves that by firing a click at the end of every drag —
   * so moving a reference card opened it in a new tab. The link keeps its own
   * control instead, which is also the only version that says out loud that it
   * leaves the app.
   */
  const Shell = fill ? "div" : "a";
  const shellProps = fill
    ? { style: { color: "var(--text)", height: "100%" } }
    : {
        href: item.url,
        target: "_blank",
        rel: "noreferrer noopener",
        style: { color: "var(--text)" },
      };

  return (
    <Shell
      {...(shellProps as Record<string, unknown>)}
      className="flex flex-col gap-1.5 p-3 no-underline overflow-hidden"
    >
      {fill && item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={isAr ? `افتح ${host}` : `Open ${host}`}
          title={item.url}
          onPointerDown={(e) => e.stopPropagation()}
          className="mk-icon-btn absolute top-1.5 rounded-md"
          style={{ insetInlineEnd: 30, background: "var(--scrim)", color: "var(--scrim-ink)" }}
        >
          <Icon name="external-link-alt" size={10} />
        </a>
      )}
      {asset?.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.url}
          alt=""
          loading="lazy"
          draggable={false}
          className="rounded-lg"
          style={{ width: "100%", display: "block" }}
        />
      )}
      <span className="flex items-center gap-1.5 text-[10.5px]" style={{ color: "var(--text-faint)" }}>
        <Icon name="link" size={10} />
        <span dir="ltr" className="bidi-auto truncate">{host}</span>
      </span>
      <span dir="auto" className="bidi-auto text-[12.5px] leading-[1.4]">
        {item.name || item.url || (isAr ? "رابط" : "Link")}
      </span>
    </Shell>
  );
}

function FontCard({ item, asset, isAr }: { item: MoodboardItem; asset?: Asset; isAr: boolean }) {
  const family = item.name || asset?.font?.family || asset?.fileName || (isAr ? "خط" : "Typeface");
  return (
    <div className="flex flex-col gap-1 p-3">
      <span className="text-[10.5px] flex items-center gap-1.5" style={{ color: "var(--text-faint)" }}>
        <Icon name="font" size={10} />
        {isAr ? "خط" : "Typeface"}
      </span>
      {/* Both scripts, because a bilingual brand needs both to hold up and
          the Latin specimen alone is how a font gets chosen and then fails. */}
      <span dir="auto" className="bidi-auto text-[20px] leading-tight" style={{ fontFamily: `"${family}", inherit` }}>
        {family}
      </span>
      <span
        dir="rtl"
        className="text-[18px] leading-tight"
        style={{ fontFamily: `"${family}", inherit`, color: "var(--text-muted)" }}
      >
        نموذج نصي
      </span>
    </div>
  );
}

function Footer({
  item,
  asset,
  isAr,
  me,
  onVote,
  onRemove,
  onEdit,
  onArm,
}: CardProps & { onArm: (armed: boolean) => void }) {
  const mine = item.votes.includes(me);
  const count = item.votes.length;
  const label = asset?.fileName ?? item.name ?? item.note?.slice(0, 40) ?? (isAr ? "بطاقة" : "card");

  return (
    <figcaption
      className="flex items-center gap-1 px-2 h-9 shrink-0"
      style={{ background: "var(--surface-1)", boxShadow: "inset 0 1px 0 var(--hairline)" }}
    >
      <span
        role="button"
        tabIndex={-1}
        aria-hidden
        onMouseDown={() => onArm(true)}
        onMouseUp={() => onArm(false)}
        title={isAr ? "اسحب للنقل" : "Drag to move"}
        className="h-6 w-6 grid place-items-center shrink-0"
        style={{ cursor: "grab", color: "var(--text-faint)" }}
      >
        <Icon name="grip-vertical" size={11} />
      </span>

      <button
        type="button"
        onClick={onVote}
        aria-pressed={mine}
        aria-label={
          mine
            ? isAr ? `أزل اختيارك لـ ${label}` : `Remove your pick from ${label}`
            : isAr ? `اختر ${label}` : `Pick ${label}`
        }
        title={count > 0 ? item.votes.join(", ") : isAr ? "لم يخترها أحد بعد" : "Nobody has picked this yet"}
        className="mk-tap h-6 px-2 rounded-full text-[11px] font-semibold cursor-pointer flex items-center gap-1 shrink-0"
        style={{
          background: mine ? "var(--accent-soft)" : "transparent",
          color: mine ? "var(--accent-on-soft)" : "var(--text-faint)",
        }}
      >
        <Icon name="check" size={10} />
        {count > 0 ? count : isAr ? "اختر" : "Pick"}
      </button>

      <span className="ms-auto flex items-center shrink-0">
        <select
          value={item.size}
          onChange={(e) => onEdit({ size: e.target.value as MoodboardItem["size"] })}
          aria-label={isAr ? `حجم ${label}` : `Size of ${label}`}
          className="h-6 bg-transparent outline-none text-[10.5px] cursor-pointer"
          style={{ color: "var(--text-faint)" }}
        >
          <option value="s">S</option>
          <option value="m">M</option>
          <option value="l">L</option>
        </select>
        {asset?.credit?.sourceUrl && (
          <a
            href={asset.credit.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={isAr ? `مصدر ${label}` : `Source of ${label}`}
            title={asset.credit.source || asset.credit.sourceUrl}
            className="mk-icon-btn"
          >
            <Icon name="external-link-alt" size={11} style={{ color: "var(--text-faint)" }} />
          </a>
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label={isAr ? `احذف ${label} من اللوح` : `Take ${label} off the board`}
          title={isAr ? "حذف — يمكن التراجع" : "Delete — you can undo this"}
          // Named for the sweeps, which delete a specific card in both
          // languages and cannot select it by a label that changes with them.
          data-mood-remove
          className="mk-icon-btn mk-danger-hover cursor-pointer"
        >
          <Icon name="times" size={11} style={{ color: "var(--text-faint)" }} />
        </button>
      </span>
    </figcaption>
  );
}
