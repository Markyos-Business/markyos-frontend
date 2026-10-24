"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { useLocalPref } from "@/hooks/useLocalPref";
import { useNarrowViewport } from "@/hooks/useNarrowViewport";

export interface SidebarItem {
  key: string;
  label: string;
  icon: string;
  href: string;
  active?: boolean;
  /** A count or short note beside the label; a dot once the rail collapses. */
  badge?: string | number;
}

export interface SidebarSection {
  key: string;
  /** Omit for a group with no heading. */
  label?: string;
  items: SidebarItem[];
}

/*
 * 248, not 232.
 *
 * At 232 the longest item in the brand nav — "Company departments", next to
 * its count — needed 140px and had 137, so the primary navigation label was
 * ellipsed on every page of the app, with no title to recover it from. A nav
 * item is the one string that has to be readable before you know what it says:
 * truncating it means choosing a destination from a word and a half.
 */
const OPEN = "w-[248px] px-4";
const RAIL = "w-[60px] px-2";

/**
 * The app's left-hand navigation, collapsible to an icon rail.
 *
 * Every shell uses this one component and only supplies its own items, so a
 * brand, the admin area and anything after them navigate the same way: the
 * same widths, the same `[` shortcut, the same rail on narrow screens.
 */
export function AppSidebar({
  label,
  title,
  titleHref,
  titleBadge,
  sections,
  footer = [],
  storageKey,
  isAr = false,
  collapseLabels = { collapse: "Collapse sidebar", expand: "Expand sidebar" },
  rootProps,
}: {
  /** The navigation landmark's accessible name. */
  label: string;
  /** Beside the mark: the brand's name, or the area's. */
  title: string;
  titleHref: string;
  titleBadge?: ReactNode;
  sections: SidebarSection[];
  /** Pinned to the bottom, e.g. Settings. */
  footer?: SidebarItem[];
  /** Where the collapsed preference is remembered, per sidebar. */
  storageKey: string;
  isAr?: boolean;
  collapseLabels?: { collapse: string; expand: string };
  /** Extra attributes for the root, e.g. a `data-*` hook for a sweep. */
  rootProps?: Record<string, string>;
}) {
  const [preference, setCollapsed] = useLocalPref(storageKey, false);
  const narrow = useNarrowViewport();
  // The stored preference still belongs to the person; a narrow viewport just
  // outranks it while it lasts, and the preference is waiting when they widen
  // the window again.
  const collapsed = narrow || preference;

  /**
   * `[` collapses and expands the rail.
   *
   * The shortcut is skipped while a field has focus — typing a bracket into a
   * brand name should type a bracket, not rearrange the window.
   */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "[" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      e.preventDefault();
      setCollapsed(!collapsed);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [collapsed, setCollapsed]);

  function renderItem(item: SidebarItem, extra = "") {
    const { active, badge, label: name } = item;
    return (
      <Link
        key={item.key}
        href={item.href}
        aria-current={active ? "page" : undefined}
        // The title is the only thing naming this item once the rail is
        // collapsed, so it carries the badge too — otherwise "3 pending
        // approvals" becomes an unexplained dot.
        title={collapsed ? (badge !== undefined ? `${name} — ${badge}` : name) : undefined}
        aria-label={collapsed ? name : undefined}
        className={`mk-nav-item relative flex items-center rounded-lg py-2.5 text-[13px] transition-colors ${
          collapsed ? "justify-center px-0" : "gap-2.5 px-2.5"
        } ${active ? "bg-surface-2 font-medium text-text" : "bg-transparent font-normal text-text-muted"} ${extra}`}
      >
        <Icon name={item.icon} size={18} className={`shrink-0 ${active ? "text-accent" : ""}`} />
        {collapsed ? (
          // A count can't be read at 60px wide, so it becomes a presence
          // marker: something is waiting here. The title says what.
          badge !== undefined && (
            <span aria-hidden className="absolute end-2.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
          )
        ) : (
          <>
            <span className="flex-1 truncate">{name}</span>
            {badge !== undefined && (
              <span className="shrink-0 text-[10px] font-medium text-text-faint [font-family:ui-monospace,Menlo,monospace]">
                {badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  }

  return (
    <nav
      aria-label={label}
      {...rootProps}
      // Width is the only thing that animates. Fading the labels as well
      // reads as the panel hesitating; they simply aren't there at the other
      // size, and the eye follows the edge, not the text.
      className={`flex shrink-0 flex-col gap-6 overflow-y-auto overflow-x-hidden py-5 shadow-[inset_-1px_0_0_var(--hairline)] transition-[width,padding-inline] duration-200 ease-[cubic-bezier(0.2,0.7,0.3,1)] rtl:shadow-[inset_1px_0_0_var(--hairline)] ${
        collapsed ? RAIL : OPEN
      }`}
    >
      <div className={`flex shrink-0 items-center ${collapsed ? "justify-center" : "gap-2.5 px-2"}`}>
        <Link
          href={titleHref}
          // In the rail the mark is all there is, and an 18px-wide logo is an
          // 18px-wide target — so the link keeps a full-size hit area of its
          // own rather than shrink-wrapping the image.
          className={`mk-tap min-w-0 gap-2.5 ${collapsed ? "min-h-[32px] min-w-[32px] justify-center" : ""}`}
          title={collapsed ? title : undefined}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/markyos-mark.svg" alt="Markyos" className="h-[22px] w-auto shrink-0 [filter:var(--chrome-mark-invert)]" />
          {!collapsed && (
            <span className="flex-1 truncate font-display text-[15px] font-semibold tracking-tight">{title}</span>
          )}
          {!collapsed && titleBadge}
        </Link>
        {!collapsed && (
          <CollapseButton collapsed={collapsed} isAr={isAr} labels={collapseLabels} onClick={() => setCollapsed(true)} />
        )}
      </div>

      {/* No expand control while the viewport is what's forcing the rail —
          a button that does nothing is worse than no button. */}
      {collapsed && !narrow && (
        <div className="-mt-3 flex shrink-0 justify-center">
          <CollapseButton collapsed={collapsed} isAr={isAr} labels={collapseLabels} onClick={() => setCollapsed(false)} />
        </div>
      )}

      {sections.map((section) => (
        <div key={section.key} className="flex flex-col gap-0.5">
          {section.label &&
            (collapsed ? (
              // A heading with nothing legible under it is noise; the rule
              // keeps the groups visibly separate without pretending to be a
              // label.
              <div className="mx-3 mb-1.5 h-px shrink-0 bg-hairline" />
            ) : (
              <div className="truncate px-2 pb-2.5 text-[11px] font-medium uppercase tracking-[0.1em] text-text-faint">
                {section.label}
              </div>
            ))}
          {section.items.map((item) => renderItem(item))}
        </div>
      ))}

      {footer.map((item, i) => renderItem(item, `shrink-0 ${i === 0 ? "mt-auto" : ""}`))}
    </nav>
  );
}

function CollapseButton({
  collapsed,
  isAr,
  labels,
  onClick,
}: {
  collapsed: boolean;
  isAr: boolean;
  labels: { collapse: string; expand: string };
  onClick: () => void;
}) {
  const label = collapsed ? labels.expand : labels.collapse;
  // The chevron points the way the panel will move, which in Arabic is the
  // other way — a fixed "«" would point into the page on an RTL layout.
  const pointsStart = collapsed === isAr;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={!collapsed}
      title={`${label} — [`}
      className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-md text-text-faint transition-colors"
    >
      <Icon name={pointsStart ? "angle-double-left" : "angle-double-right"} size={13} />
    </button>
  );
}
