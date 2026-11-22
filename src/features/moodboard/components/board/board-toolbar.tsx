import { ActionsDropdown, Button, Icon, IconButton, SegmentedControl } from "@/components/ui";
import { MoodboardSaveIndicator } from "./save-indicator";
import type { Moodboard } from "@/types";
import { VIEW_TABS } from "../../constants";

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
    <div className={`shrink-0 flex-wrap items-center gap-ctl-row ${hidden ? "hidden" : "flex"}`}>
      <h1 dir="auto" className="bidi-auto min-w-0 truncate text-h4 font-medium">
        {board.title}
      </h1>
      <IconButton icon="pen" label={isAr ? "أعد تسمية اللوح" : "Rename board"} onClick={onRename} className="cursor-pointer text-text-faint" />
      <MoodboardSaveIndicator isAr={isAr} />

      {/* Two ways to work the same board, not two features. The canvas is
          where arranging happens and it is a pointer instrument; the list is
          where everything else is, and it is the one a keyboard can drive. */}
      {/* The kit's "choose one" pill (MARKYOS_UI §2.5), not a hand-made one. */}
      <div className="ms-auto">
        <SegmentedControl
          label={isAr ? "طريقة العرض" : "View"}
          options={VIEW_TABS.map((t) => ({ value: t.key, label: isAr ? t.ar : t.en, icon: t.icon }))}
          value={view}
          onChange={onView}
        />
      </div>

      {/* Tidy and zoom live on the board's own toolbar, which exists in full
          screen. The shortlist filter belongs to the list view. */}
      {view === "columns" && (
        <label className="flex cursor-pointer items-center gap-ctl-icon text-[12px]">
          <input type="checkbox" checked={shortlistOnly} onChange={(e) => onShortlistOnly(e.target.checked)} className="cursor-pointer accent-accent" />
          {isAr ? "المختارة فقط" : "Shortlist only"}
        </label>
      )}

      <Button variant="ghost" icon={<Icon name="plus" size={16} />} onClick={onAddZone} className="text-[12px] font-semibold">
        {isAr ? "قسم" : "Zone"}
      </Button>
      {/* Deleting the whole board sits behind More, apart from Zone:
          "make something" and "destroy everything" are never neighbours. On a
          phone it also stopped being a stray line of text under the toolbar. */}
      <ActionsDropdown
        iconOnly
        label={isAr ? "المزيد" : "More"}
        items={[
          { label: isAr ? "إعادة تسمية اللوح" : "Rename board", icon: "pen", onSelect: onRename },
          { label: isAr ? "حذف اللوح" : "Delete board", icon: "trash", tone: "danger", onSelect: onDelete },
        ]}
      />
    </div>
  );
}
