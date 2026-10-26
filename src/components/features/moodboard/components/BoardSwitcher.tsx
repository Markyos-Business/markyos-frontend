import { Button } from "@/components/ui";
import type { Moodboard } from "@/types";

type BoardSwitcherProps = {
  boards: Moodboard[];
  activeId: string | undefined;
  isAr: boolean;
  picking: boolean;
  hidden: boolean;
  onActive: (id: string) => void;
  onTogglePicking: () => void;
};

/** The brand's boards, with each one's card count, and starting another. */
export function BoardSwitcher({ boards, activeId, isAr, picking, hidden, onActive, onTogglePicking }: BoardSwitcherProps) {
  return (
    <div className={`shrink-0 flex-wrap items-center gap-2 ${hidden ? "hidden" : "flex"}`}>
      {boards.map((b) => {
        const count = b.zones.reduce((n, z) => n + z.items.length, 0);
        const on = activeId === b.id;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => onActive(b.id)}
            aria-pressed={on}
            className={`h-8 cursor-pointer rounded-full px-3.5 text-[12px] font-semibold ${on ? "bg-accent-soft text-accent-on-soft" : "bg-surface-1 text-text-muted"}`}
          >
            <span dir="auto" className="bidi-auto">
              {b.title}
            </span>
            {count > 0 && ` · ${count}`}
          </button>
        );
      })}
      <Button variant="link" onClick={onTogglePicking} aria-expanded={picking} className="px-1 text-[12px] font-semibold">
        {isAr ? "+ لوح جديد" : "+ New board"}
      </Button>
    </div>
  );
}
