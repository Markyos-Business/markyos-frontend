import { Icon } from "@/components/ui";

type PanelRevealProps = { side: "start" | "end"; isAr: boolean; label: string; onClick: () => void };

/**
 * The handle a hidden panel leaves behind.
 *
 * A panel that collapses to nothing is a panel people can't find again, so a
 * thin strip stays on the edge it went to: it reads as the panel's own edge and
 * covers none of the canvas it just gave room to.
 */
export function PanelReveal({ side, isAr, label, onClick }: PanelRevealProps) {
  // The chevron points the way the panel will grow, which follows the writing
  // direction: "start" grows rightward in English and leftward in Arabic.
  const pointsRight = side === "start" ? !isAr : isAr;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`mk-reveal grid w-6 shrink-0 cursor-pointer place-items-center text-text-faint transition-colors ${
        side === "start" ? "shadow-[inset_-1px_0_0_var(--hairline)]" : "shadow-[inset_1px_0_0_var(--hairline)]"
      }`}
    >
      <Icon name={pointsRight ? "angle-double-right" : "angle-double-left"} size={12} />
    </button>
  );
}
