import { Button, EmptyHint, Icon } from "@/components/ui";
import { MOODBOARD_TEMPLATES } from "../model/templates";

type TemplatePickerProps = {
  isAr: boolean;
  onPick: (templateKey: string, title: string) => void;
  onUpload: () => void;
  hasBoard: boolean;
};

/**
 * Starting a board is choosing a method.
 *
 * Offered as named approaches rather than "new board", because the difference
 * between exploring a new brand and evolving an existing one is the whole shape
 * of the work — and a person who has to invent the zones themselves will invent
 * the same four every time.
 */
export function TemplatePicker({ isAr, onPick, onUpload, hasBoard }: TemplatePickerProps) {
  return (
    // Named, so a probe can reach the templates without matching a board that
    // happens to be called after the template it was made from.
    <div data-template-picker className="flex flex-col gap-3">
      {!hasBoard && (
        <EmptyHint>
          {isAr
            ? "لا توجد ألواح بعد. ابدأ من أحد الأساليب أدناه — كل قسم فيه يشرح ما يُوضع فيه."
            : "No boards yet. Start from one of these — every zone comes with a note on what belongs in it."}
        </EmptyHint>
      )}
      <div className="grid max-w-[900px] grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {MOODBOARD_TEMPLATES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onPick(t.key, isAr ? t.arTitle : t.title)}
            className="mk-card flex cursor-pointer items-start gap-2.5 rounded-xl bg-surface-1 p-3 text-start"
          >
            <Icon name={t.icon} size={16} className="mt-0.5 shrink-0 text-accent-text" />
            <span className="min-w-0">
              <span dir="auto" className="bidi-auto block text-[12.5px] font-medium">
                {isAr ? t.arTitle : t.title}
              </span>
              <span dir="auto" className="bidi-auto mt-0.5 block text-[11px] text-text-faint">
                {isAr ? t.arDescription : t.description}
              </span>
              <span className="mt-1 block text-[10.5px] text-text-faint">{t.zones.map((z) => (isAr ? z.arTitle : z.title)).join(" · ")}</span>
            </span>
          </button>
        ))}
      </div>
      {!hasBoard && (
        <div>
          <Button variant="outline" onClick={onUpload}>
            {isAr ? "أو ارفع مراجع مباشرة" : "Or just upload references"}
          </Button>
        </div>
      )}
    </div>
  );
}
