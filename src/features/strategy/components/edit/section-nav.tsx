"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { revealInScroller } from "@/lib/scroll";
import { STRATEGY_TABS, strategySectionHref, type StrategyTab } from "../../constants";
import { strategyCopy } from "../../copy";

/**
 * The Strategy sections (review item 4): ten sections are too many for a row
 * of tabs (it wrapped onto two lines), so they are a list of links beside the
 * section being edited, each with its own address. From 1024px up the list is
 * vertical; below it is one row that scrolls sideways and never wraps.
 *
 * Links, not tabs: each one goes to a page. The current one carries
 * aria-current="page". Arrow keys move between them (up/down in the list,
 * start/end in the row, following the reading direction), Home and End jump
 * to the ends, Tab leaves the list.
 */
export function StrategySectionNav({
  slug,
  current,
  empty,
  isAr,
}: {
  slug: string;
  current: StrategyTab;
  empty: Record<StrategyTab, boolean>;
  isAr: boolean;
}) {
  const c = strategyCopy(isAr).sections;
  const list = useRef<HTMLOListElement>(null);

  // In the scrolling row, keep the current section in sight (a deep link to the tenth).
  useEffect(() => {
    const el = list.current;
    revealInScroller(el, el?.querySelector<HTMLElement>('[aria-current="page"]') ?? null);
  }, [current]);

  function onKeyDown(event: React.KeyboardEvent<HTMLOListElement>) {
    const links = [...(list.current?.querySelectorAll<HTMLAnchorElement>("a") ?? [])];
    const at = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (at < 0) return;
    // In the row, "forward" is the reading direction: right in English, left in Arabic.
    const forward = ["ArrowDown", isAr ? "ArrowLeft" : "ArrowRight"];
    const back = ["ArrowUp", isAr ? "ArrowRight" : "ArrowLeft"];
    let next = -1;
    if (forward.includes(event.key)) next = Math.min(links.length - 1, at + 1);
    else if (back.includes(event.key)) next = Math.max(0, at - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = links.length - 1;
    if (next < 0) return;
    event.preventDefault();
    links[next].focus();
  }

  return (
    <nav aria-label={c.nav} className="min-w-0 lg:sticky lg:top-0 lg:self-start">
      <ol
        ref={list}
        onKeyDown={onKeyDown}
        className="mk-no-hover flex gap-ctl-row overflow-x-auto pb-space-1 lg:flex-col lg:gap-space-1 lg:overflow-visible lg:pb-0"
      >
        {STRATEGY_TABS.map((t, i) => {
          const on = t.key === current;
          return (
            <li key={t.key} className="shrink-0">
              <Link
                href={strategySectionHref(slug, t.key)}
                aria-current={on ? "page" : undefined}
                // button-audit-ignore: a link in the sections list, drawn as a nav item
                className={`flex min-h-ctl-md items-center gap-space-3 whitespace-nowrap rounded-lg px-space-4 text-body lg:whitespace-normal lg:py-space-2 ${
                  on ? "bg-surface-2 font-medium text-text shadow-edge" : "text-text-muted"
                }`}
              >
                <span aria-hidden className="w-5 shrink-0 text-caption tabular-nums text-text-faint">{i + 1}</span>
                {/* One line in the phone's sideways strip; wrapped, never cut, in the desktop list ("Target audience & perso…"). */}
                <span dir="auto" className="bidi-auto min-w-0 flex-1 truncate lg:overflow-visible lg:whitespace-normal">{isAr ? t.arLabel : t.label}</span>
                {empty[t.key] && (
                  <span
                    role="img"
                    aria-label={c.empty}
                    title={c.empty}
                    className="size-1.5 shrink-0 rounded-full shadow-[inset_0_0_0_1.5px_var(--text-faint)]"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
