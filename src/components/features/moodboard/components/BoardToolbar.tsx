import { Button, Icon, IconButton } from "@/components/ui";
import type { Moodboard } from "@/types";
import { VIEW_TABS } from "../constants";

type BoardToolbarProps = {
  board: Moodboard;
  view: "canvas" | "columns";
  isAr: boolean;
  hidden: boolean;
  shortlistOnly: boolean;
  onView: (view: "canvas" | "columns") => void;
  onShortlistOnly: (on: boolean) => void;
  onRename: () => void;
  onAddZone: () => void;
  onDelete: () => void;
};

/** The open board's name, its two views, and adding a zone or deleting the board. */
export function BoardToolbar({ board, view, isAr, hidden, shortlistOnly, onView, onShortlistOnly, onRename, onAddZone, onDelete }: BoardToolbarProps) {
  return (
    <div className={`shrink-0 flex-wrap items-center gap-3 ${hidden ? "hidden" : "flex"}`}>
      <h2 dir="auto" className="bidi-auto text-[16px] font-semibold">
        {board.title}
      </h2>
      <IconButton icon="pen" label={isAr ? "أعد تسمية اللوح" : "Rename board"} onClick={onRename} className="cursor-pointer text-text-faint" />

      {/* Two ways to work the same board, not two features. The canvas is
          where arranging happens and it is a pointer instrument; the list is
          where everything else is, and it is the one a keyboard can drive. */}
      <div className="ms-auto flex rounded-full bg-surface-1 p-0.5" role="tablist">
        {VIEW_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={view === t.key}
            onClick={() => onView(t.key)}
            className={`flex h-7 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold ${
              view === t.key ? "bg-surface-2 text-text" : "text-text-faint"
            }`}
          >
            <Icon name={t.icon} size={11} />
            {isAr ? t.ar : t.en}
          </button>
        ))}
      </div>

      {/* Tidy and zoom live on the board's own toolbar, which exists in full
          screen. The shortlist filter belongs to the list view. */}
      {view === "columns" && (
        <label className="flex cursor-pointer items-center gap-2 text-[12px]">
          <input type="checkbox" checked={shortlistOnly} onChange={(e) => onShortlistOnly(e.target.checked)} className="cursor-pointer accent-accent" />
          {isAr ? "المختارة فقط" : "Shortlist only"}
        </label>
      )}

      <Button variant="link" onClick={onAddZone} className="text-[12px] font-semibold">
        {isAr ? "+ قسم" : "+ Zone"}
      </Button>
      {/* A rule between adding a zone and deleting the whole board: "make
          something" and "destroy everything" must not be told apart only by
          reading the label. */}
      <span aria-hidden className="mx-1.5 h-4 w-px bg-hairline-strong" />
      <button type="button" onClick={onDelete} className="mk-tap mk-danger-text cursor-pointer text-[12px] text-text-faint">
        {isAr ? "حذف اللوح" : "Delete board"}
      </button>
    </div>
  );
}
