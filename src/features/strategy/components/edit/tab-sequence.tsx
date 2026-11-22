"use client";

import { Button, Icon } from "@/components/ui";
import { STRATEGY_TABS, strategySectionHref, type StrategyTab } from "../../constants";
import { strategyCopy } from "../../copy";

/** Previous and next are links to the sections' own addresses (review item 4). */
type TabSequenceProps = { current: StrategyTab; slug: string; isAr: boolean; empty: Record<StrategyTab, boolean> };

/**
 * Where you are in the strategy, and what comes next. A brand strategy is
 * written in an order, so the foot of each section says where it sits and
 * offers the next one, and whether that one is still empty.
 */
export function TabSequence({ current, slug, isAr, empty }: TabSequenceProps) {
  const i = STRATEGY_TABS.findIndex((t) => t.key === current);
  if (i < 0) return null;
  const prev = i > 0 ? STRATEGY_TABS[i - 1] : null;
  const next = i < STRATEGY_TABS.length - 1 ? STRATEGY_TABS[i + 1] : null;
  const name = (t: { label: string; arLabel: string }) => (isAr ? t.arLabel : t.label);

  // The chevrons point the way the reader is going, which in Arabic is the
  // other way — a fixed "→" for "next" would point backwards on an RTL page.
  const backIcon = "angle-left";
  const onIcon = "angle-right";

  return (
    <nav aria-label={strategyCopy(isAr).sections.sequence} className="flex items-center gap-ctl-row pb-2 pt-1">
      {prev ? (
        <Button variant="secondary" size="sm" href={strategySectionHref(slug, prev.key)} icon={<Icon name={backIcon} size={16} />} className="text-text-muted">
          <span dir="auto" className="bidi-auto">
            {name(prev)}
          </span>
        </Button>
      ) : (
        <span />
      )}

      <span className="mx-auto text-[11.5px] tabular-nums text-text-faint">{isAr ? `${i + 1} من ${STRATEGY_TABS.length}` : `${i + 1} of ${STRATEGY_TABS.length}`}</span>

      {next ? (
        <Button variant="secondary" size="sm" href={strategySectionHref(slug, next.key)}>
          <span className="text-[11px] font-normal text-text-faint">{isAr ? "التالي" : "Next"}</span>
          <span dir="auto" className="bidi-auto">
            {name(next)}
          </span>
          {empty[next.key] && (
            <span
              title={isAr ? "لا يوجد محتوى بعد" : "Nothing here yet"}
              aria-label={isAr ? "لا يوجد محتوى بعد" : "Nothing here yet"}
              role="img"
              className="h-[6px] w-[6px] shrink-0 rounded-full shadow-[inset_0_0_0_1.5px_var(--text-faint)]"
            />
          )}
          <Icon name={onIcon} size={16} />
        </Button>
      ) : (
        <span />
      )}
    </nav>
  );
}
