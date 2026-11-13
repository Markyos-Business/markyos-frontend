"use client";

import Link from "next/link";
import { ActionsDropdown, Icon } from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import type { Asset, Moodboard } from "@/types";
import { MOODBOARD_TEMPLATES } from "../../utils/templates";
import { boardHref, cardCount } from "../../hooks/projects/use-moodboard-projects-page";

type BoardProjectCardProps = {
  board: Moodboard;
  slug: string;
  assets: Map<string, Asset>;
  isAr: boolean;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

/** What a board looks like from outside: its first images, else its colours. */
function Preview({ board, assets }: { board: Moodboard; assets: Map<string, Asset> }) {
  const items = [...board.zones].sort((a, b) => (a.order < b.order ? -1 : 1)).flatMap((z) => z.items);
  const images = items.flatMap((i) => {
    const a = i.kind === "asset" && i.assetId ? assets.get(i.assetId) : undefined;
    return a?.url ? [a] : [];
  });
  const swatches = items.flatMap((i) => (i.kind === "swatch" && i.hex ? [i.hex] : []));

  if (images.length > 0) {
    const shown = images.slice(0, 4);
    return (
      <div className={`grid h-40 gap-0.5 overflow-hidden bg-surface-2 ${shown.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {shown.map((a, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={a.id}
            src={a.url}
            alt=""
            loading="lazy"
            draggable={false}
            className={`size-full object-cover ${shown.length === 3 && i === 0 ? "row-span-2" : ""}`}
          />
        ))}
      </div>
    );
  }
  if (swatches.length > 0) {
    return (
      <div className="flex h-40 overflow-hidden">
        {swatches.slice(0, 6).map((hex, i) => (
          <span key={`${hex}-${i}`} className="flex-1" style={{ background: hex }} />
        ))}
      </div>
    );
  }
  return (
    <div className="grid h-40 place-items-center bg-surface-2 text-text-faint">
      <Icon name="image" size={22} />
    </div>
  );
}

/**
 * One board as a project: a preview of what is on it, its name and method,
 * how much it holds and when it was last worked on. The whole card opens the
 * board; its menu renames, duplicates or deletes it.
 */
export function BoardProjectCard({ board, slug, assets, isAr, onRename, onDuplicate, onDelete }: BoardProjectCardProps) {
  const count = cardCount(board);
  const template = MOODBOARD_TEMPLATES.find((t) => t.key === board.templateKey);
  const edited = board.updatedAt ?? board.createdAt;
  return (
    <article className="mk-card relative flex flex-col overflow-hidden rounded-card bg-surface-1">
      <Link href={boardHref(slug, board.id)} className="flex flex-col focus-visible:outline-offset-[-2px]">
        <Preview board={board} assets={assets} />
        <span className="flex flex-col gap-space-1 p-space-6 pe-space-11">
          <span dir="auto" className="bidi-auto truncate text-body font-medium text-text">
            {board.title}
          </span>
          <span className="flex flex-wrap items-center gap-x-space-3 text-caption text-text-muted">
            {template && (
              <span className="flex items-center gap-space-1">
                <Icon name={template.icon} size={16} className="text-text-faint" />
                {isAr ? template.arTitle : template.title}
              </span>
            )}
            <span>
              {isAr ? (count === 0 ? "فارغ" : `${count} بطاقة`) : count === 0 ? "Empty" : `${count} card${count === 1 ? "" : "s"}`}
            </span>
            <span>
              {isAr ? "عُدّل " : "Edited "}
              {formatRelative(edited, undefined, isAr ? "ar" : "en")}
            </span>
          </span>
        </span>
      </Link>
      {/* Outside the link: a menu inside it would also open the board. */}
      <div className="absolute bottom-space-6 end-space-4">
        <ActionsDropdown
          iconOnly
          label={isAr ? `إجراءات ${board.title}` : `Actions for ${board.title}`}
          title={isAr ? `إجراءات ${board.title}` : `${board.title} actions`}
          items={[
            { label: isAr ? "أعد التسمية" : "Rename", icon: "pen", onSelect: onRename },
            { label: isAr ? "تكرار" : "Duplicate", icon: "copy", onSelect: onDuplicate },
            { label: isAr ? "حذف" : "Delete", icon: "trash", tone: "danger", onSelect: onDelete },
          ]}
        />
      </div>
    </article>
  );
}
