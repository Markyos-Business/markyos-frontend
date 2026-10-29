"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { Badge, Icon } from "@/components/ui";
import { useLocalPref } from "@/hooks/useLocalPref";
import { useNarrowViewport } from "@/hooks/useNarrowViewport";
import { useSidebarPlacement } from "../SidebarDrawer";

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
 * The spec's NavRail (MARKYOS_UI.md §5): 84px wide as a rail, 240px expanded
 * with labels, counts and section headings. Rows are 64px in the rail, each
 * icon on a 48px tile; expanded, the tile is the whole row.
 */
const OPEN = "w-60 px-space-3";
const RAIL = "w-rail px-0";

/**
 * The app's navigation, collapsible to an icon rail.
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
  footerSlot,
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
  /** Under the footer links, e.g. the signed-in person's card. Hidden on the collapsed rail. */
  footerSlot?: ReactNode;
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
  // In the phone drawer it is always the full sidebar: the drawer is the
  // compact form, and a rail inside a drawer would be a rail with nowhere to go.
  const inDrawer = useSidebarPlacement() === "drawer";
  const collapsed = !inDrawer && (narrow || preference);

  /**
   * `[` collapses and expands the rail.
   *
   * The shortcut is skipped while a field has focus — typing a bracket into a
   * brand name should type a bracket, not rearrange the window.
   */
  useEffect(() => {
    if (inDrawer) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "[" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      e.preventDefault();
      setCollapsed(!collapsed);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [collapsed, setCollapsed, inDrawer]);

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
        // Expanded, it still names the item in case a long label is cut off.
        title={badge !== undefined ? `${name} — ${badge}` : name}
        aria-label={collapsed ? name : undefined}
        className={`group relative flex shrink-0 items-center ${collapsed ? "h-rail-item justify-center" : "h-rail-item-box"} ${extra}`}
      >
        {/* The tile: the accent tint when active, a raised fill on hover. */}
        <span
          className={`flex items-center rounded-sm transition-colors ${
            collapsed ? "size-rail-item-box justify-center" : "h-full w-full gap-space-4 px-space-4"
          } ${active ? "bg-accent-soft text-text" : "text-text-muted group-hover:bg-surface-2 group-hover:text-text"}`}
        >
          <Icon name={item.icon} size={22} className={`shrink-0 ${active ? "text-accent" : ""}`} />
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-body font-medium">{name}</span>
              {badge !== undefined && <Badge tone={active ? "accent" : "neutral"}>{badge}</Badge>}
            </>
          )}
        </span>
        {/* A count can't be read in the rail, so it becomes a presence marker:
            something is waiting here. The title says what. */}
        {collapsed && badge !== undefined && (
          <span aria-hidden className="absolute end-5 top-3 size-2 rounded-full bg-accent shadow-ring-status" />
        )}
        {/* The active bar: 2px of the accent, with its glow, on the rail's
            inline-end edge. */}
        {active && (
          <span
            aria-hidden
            className={`absolute top-1/2 h-8 w-0.5 -translate-y-1/2 rounded-full bg-accent shadow-glow ${collapsed ? "end-0" : "-end-space-3"}`}
          />
        )}
      </Link>
    );
  }

  return (
    <nav
      aria-label={label}
      {...rootProps}
      // Collapsing snaps rather than animating its width: a width animation
      // reflows the whole page on every frame (docs/ui/motion.md). In the
      // phone drawer it fills the drawer, which draws its own edge.
      // The 1px separator on the inline-end side is the hairline at 10%.
      className={`flex shrink-0 flex-col gap-space-8 overflow-y-auto overflow-x-hidden py-space-8 ${
        inDrawer
          ? "h-full w-72 max-w-full px-space-3"
          : `bg-sidebar shadow-[inset_-1px_0_0_var(--hairline-strong)] rtl:shadow-[inset_1px_0_0_var(--hairline-strong)] ${collapsed ? RAIL : OPEN}`
      }`}
    >
      <div className={`flex shrink-0 items-center ${collapsed ? "justify-center" : "gap-space-4 px-space-2"}`}>
        <Link
          href={titleHref}
          // In the rail the mark is all there is, and an 18px-wide logo is an
          // 18px-wide target — so the link keeps a full-size hit area of its
          // own rather than shrink-wrapping the image.
          className={`mk-tap min-w-0 gap-space-4 ${collapsed ? "min-h-8 min-w-8 justify-center" : ""}`}
          title={collapsed ? title : undefined}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/markyos-mark.svg" alt="Markyos" className="h-[22px] w-auto shrink-0 [filter:var(--chrome-mark-invert)]" />
          {!collapsed && (
            <span className="flex-1 truncate text-h5 font-medium">{title}</span>
          )}
          {!collapsed && titleBadge}
        </Link>
        {!collapsed && !inDrawer && (
          <CollapseButton collapsed={collapsed} isAr={isAr} labels={collapseLabels} onClick={() => setCollapsed(true)} />
        )}
      </div>

      {/* No expand control while the viewport is what's forcing the rail —
          a button that does nothing is worse than no button. */}
      {collapsed && !narrow && (
        <div className="-mt-space-5 flex shrink-0 justify-center">
          <CollapseButton collapsed={collapsed} isAr={isAr} labels={collapseLabels} onClick={() => setCollapsed(false)} />
        </div>
      )}

      {sections.map((section) => (
        <div key={section.key} className="flex flex-col gap-space-1">
          {section.label &&
            (collapsed ? (
              // A heading with nothing legible under it is noise; the rule
              // keeps the groups visibly separate without pretending to be a
              // label.
              <div className="mx-space-6 mb-space-2 h-px shrink-0 bg-hairline-strong" />
            ) : (
              // Sentence case: caps belong to the overline style only.
              <div className="truncate px-space-4 pb-space-3 text-caption text-text-faint">
                {section.label}
              </div>
            ))}
          {section.items.map((item) => renderItem(item))}
        </div>
      ))}

      {footer.map((item, i) => renderItem(item, `shrink-0 ${i === 0 ? "mt-auto" : ""}`))}
      {footerSlot && !collapsed && <div className={`shrink-0 pt-space-4 ${footer.length ? "" : "mt-auto"}`}>{footerSlot}</div>}
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
      className="grid size-7 shrink-0 place-items-center rounded-md text-text-muted transition-colors"
    >
      <Icon name={pointsStart ? "angle-double-left" : "angle-double-right"} size={16} />
    </button>
  );
}
