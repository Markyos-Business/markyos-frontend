"use client";

import { revealInScroller } from "@/lib/scroll";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Badge, Icon, IconButton } from "@/components/ui";
import { useLocalPref } from "@/hooks/useLocalPref";
import { useNarrowViewport } from "@/hooks/useNarrowViewport";
import { useSidebarPlacement } from "./sidebar-drawer";
import { BetaTag, MARKYOS_BETA, MarkyosLogo } from "../brand/markyos-logo";
import { SIDEBAR_RAILS, type SidebarRail } from "@/lib/sidebarRails";

export interface SidebarItem {
  key: string;
  label: string;
  icon: string;
  href: string;
  active?: boolean;
  /** A count or short note beside the label; a dot once the rail collapses. */
  badge?: string | number;
  /** A status dot beside the label, e.g. a site that is live. `label` says it in words. */
  status?: { tone: "success"; label: string };
  /**
   * A second, small link at the row's end, e.g. opening the live site while
   * the row itself opens the editor. A sibling of the row's link, never inside it.
   */
  external?: { href: string; label: string };
}

export interface SidebarSection {
  key: string;
  /** Names the group for assistive tech; shown above it when the sidebar has `headings`. */
  label?: string;
  /** Keep the name for assistive tech only, e.g. a top group that needs no heading. */
  hideHeading?: boolean;
  items: SidebarItem[];
}

/*
 * The nav (MARKYOS_UI.md §5): 300px open, 84px as a rail. On top, the brand
 * (mark, name, plan); then 36px rows, each icon on a 28px tile, in groups that
 * either carry a small heading (`headings`) or are split by a rule; at the
 * bottom, the person and a few icon links (notifications, team, settings, help).
 */
const OPEN = "w-sidebar px-space-4";
const RAIL = "w-rail px-space-3";

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
  footerIcons = [],
  headings = false,
  subtitle,
  avatar,
  switcher,
  card,
  account,
  help,
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
  /** Under the footer links, e.g. a note for a reviewer. Hidden on the collapsed rail. */
  footerSlot?: ReactNode;
  /** Icon links in the bottom bar beside the person: places you visit now and then, not the work itself. */
  footerIcons?: SidebarItem[];
  /** Show each labelled group's name above it, instead of a bare rule between groups. */
  headings?: boolean;
  /** Under the title, e.g. the brand's plan. */
  subtitle?: string;
  /** In place of the Markyos mark: the brand's logo or its letter. */
  avatar?: ReactNode;
  /** A way to another brand or area, beside the title, e.g. a brand switcher dropdown. */
  switcher?: ReactNode;
  /** Under the title: a card such as the brand's public site. Hidden on the rail. */
  card?: ReactNode;
  /** The bottom bar's person: given whether the rail is collapsed. */
  account?: (collapsed: boolean) => ReactNode;
  /** The bottom bar's help item: a link, or (with `onOpen`) a button that
   *  opens the app's help panel, the link kept as its fallback. */
  help?: { href: string; label: string; onOpen?: () => void };
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
  // Which rail this is, for the pre-paint script and the width transition.
  const rail = (Object.keys(SIDEBAR_RAILS) as SidebarRail[]).find((k) => SIDEBAR_RAILS[k] === storageKey);
  // On screen and settled: from the frame after mount, collapsing animates.
  // Before that, the remembered state just applies, so a page load never plays it.
  const [ready, setReady] = useState(false);
  // Labels slide in only when the person opens the rail, never on a load.
  const [opened, setOpened] = useState(false);
  const toggle = useCallback(
    (next: boolean) => {
      if (!next) setOpened(true);
      setCollapsed(next);
    },
    [setCollapsed]
  );
  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  /**
   * The page you are on is always in view. On a laptop-height window the list
   * runs under the bottom bar, and Team or Settings could be the active item
   * while sitting out of sight.
   */
  const listRef = useRef<HTMLDivElement>(null);
  const activeKey = [...sections.flatMap((s) => s.items), ...footer].find((item) => item.active)?.key;
  useEffect(() => {
    revealInScroller(listRef.current, listRef.current?.querySelector<HTMLElement>('[aria-current="page"]'));
  }, [activeKey]);

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
      toggle(!collapsed);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [collapsed, toggle, inDrawer]);

  function renderItem(item: SidebarItem) {
    const { active, badge, label: name, status, external } = item;
    const extra = !collapsed && external;
    const link = (
      <Link
        key={item.key}
        href={item.href}
        aria-current={active ? "page" : undefined}
        // The title is the only thing naming this item once the rail is
        // collapsed, so it carries the badge too — otherwise "3 pending
        // approvals" becomes an unexplained dot.
        title={badge !== undefined ? `${name} — ${badge}` : status ? `${name} — ${status.label}` : name}
        aria-label={collapsed ? (status ? `${name}, ${status.label}` : name) : undefined}
        className={`relative flex h-9 shrink-0 items-center rounded-lg transition-colors ${
          collapsed ? "mx-auto w-10 justify-center" : `gap-space-4 px-space-3 ${extra ? "pe-11" : ""}`
        } ${active ? "bg-ink-soft text-text" : "text-text-muted"}`}
      >
        {/* The tile: the accent when this is the page, a quiet fill otherwise. No hover tint: the rail is `mk-no-hover`. */}
        <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${active ? "bg-accent text-accent-ink" : "bg-surface-2"}`}>
          <Icon name={item.icon} size={16} />
        </span>
        {!collapsed && (
          <>
            {/* Slide in as the rail opens; on collapse they're gone at once, before the width finishes. */}
            <span className={`flex-1 truncate text-body font-medium ${opened ? "animate-label-in" : ""}`}>{name}</span>
            {badge !== undefined && (
              <span className={opened ? "animate-label-in" : undefined}>
                <Badge tone={active ? "accent" : "neutral"}>{badge}</Badge>
              </span>
            )}
            {status && (
              <>
                <span aria-hidden className="size-2 shrink-0 rounded-full bg-success" />
                <span className="sr-only">{status.label}</span>
              </>
            )}
          </>
        )}
        {collapsed && status && <span aria-hidden className="absolute end-1 top-1 size-2 rounded-full bg-success shadow-ring-status" />}
        {/* A count can't be read in the rail, so it becomes a presence marker. The title says what. */}
        {collapsed && badge !== undefined && <span aria-hidden className="absolute end-1 top-1 size-2 rounded-full bg-accent shadow-ring-status" />}
      </Link>
    );
    if (!extra) return link;
    return (
      <div key={item.key} className="relative shrink-0">
        {link}
        <a
          href={external.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={external.label}
          title={external.label}
          className="absolute end-1 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-text-muted"
        >
          <Icon name="external-link-alt" size={16} />
        </a>
      </div>
    );
  }

  /** A bottom-bar icon link: the same item, just its glyph; the title and label name it. */
  function renderIcon(item: SidebarItem) {
    return (
      <Link
        key={item.key}
        href={item.href}
        aria-current={item.active ? "page" : undefined}
        aria-label={item.badge !== undefined ? `${item.label} — ${item.badge}` : item.label}
        title={item.label}
        className={`relative grid size-9 shrink-0 place-items-center rounded-lg ${item.active ? "bg-ink-soft text-text" : "text-text-muted"}`}
      >
        <Icon name={item.icon} size={18} />
        {item.badge !== undefined && <span aria-hidden className="absolute end-1 top-1 size-2 rounded-full bg-accent shadow-ring-status" />}
      </Link>
    );
  }

  /** Between groups: a rule, or with `headings` the group's name (the rail has no room for words, so it keeps the rule). */
  const rule = <div aria-hidden className="mx-space-3 my-space-3 h-px shrink-0 bg-hairline-strong" />;
  const heading = (text: string) => (
    <div aria-hidden className="truncate px-space-3 pb-space-2 pt-space-5 text-caption text-text-muted">{text}</div>
  );

  return (
    <nav
      aria-label={label}
      {...rootProps}
      // The width animates between open and rail (tailwind/motion.js), once
      // ready. In the phone drawer it fills the drawer, which draws its own edge.
      data-rail={inDrawer ? undefined : rail}
      data-ready={ready && !inDrawer ? "" : undefined}
      // The 1px separator on the inline-end side is the hairline at 10%.
      className={`mk-no-hover flex shrink-0 flex-col overflow-hidden ${
        inDrawer
          ? "h-full w-sidebar max-w-full px-space-4"
          : `bg-sidebar shadow-[inset_-1px_0_0_var(--hairline-strong)] rtl:shadow-[inset_1px_0_0_var(--hairline-strong)] ${collapsed ? RAIL : OPEN}`
      }`}
    >
      {/* Who this is: the brand's mark, its name and plan, a way to another brand, and the collapse control. */}
      <div className={`flex shrink-0 items-center gap-space-3 py-space-6 ${collapsed ? "flex-col" : "px-space-2"}`}>
        {/* The link takes the tile's 8px corner (mk-shaped), so its press and focus tint is
            one rounded shape with the tile, not a square block behind it (review, 22 Nov 2026). */}
        <Link href={titleHref} title={collapsed ? title : undefined} className={`mk-tap mk-shaped min-w-0 gap-space-4 rounded-lg ${collapsed ? "justify-center" : "flex-1"}`}>
          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2 text-body font-medium text-text">
            {avatar ?? <MarkyosLogo variant="mark" className="h-[22px]" isAr={isAr} hideBeta />}
          </span>
          {!collapsed && (
            <span className="flex min-w-0 flex-1 flex-col">
              {/* The name sets its own direction, so a Latin name in an Arabic sidebar is cut at its end. */}
              <span className="flex min-w-0 items-center gap-space-3">
                <span dir="auto" className="truncate text-body font-medium text-text [text-align:match-parent]">{title}</span>
                {MARKYOS_BETA && !avatar && <BetaTag isAr={isAr} />}
                {titleBadge}
              </span>
              {subtitle && <span className="truncate text-caption text-text-muted">{subtitle}</span>}
            </span>
          )}
        </Link>
        {!collapsed && switcher && <span className="shrink-0">{switcher}</span>}
        {/* No expand control while the viewport is what's forcing the rail — a button that does nothing is worse than none. */}
        {!inDrawer && !(collapsed && narrow) && (
          <CollapseButton collapsed={collapsed} labels={collapseLabels} onClick={() => toggle(!collapsed)} />
        )}
      </div>

      {card && !collapsed && <div className="shrink-0 pb-space-6">{card}</div>}

      {/* The bottom fade says the list goes on when it runs under the bar. */}
      <div ref={listRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-space-6 [mask-image:linear-gradient(to_bottom,black_calc(100%-24px),transparent)]">
        {sections.map((section, i) => (
          <div key={section.key} role="group" aria-label={section.label} className="flex flex-col gap-space-1">
            {headings && !collapsed ? section.label && !section.hideHeading && heading(section.label) : i > 0 && rule}
            {section.items.map((item) => renderItem(item))}
          </div>
        ))}
        {footer.length > 0 && (
          <div className="flex flex-col gap-space-1">
            {rule}
            {footer.map((item) => renderItem(item))}
          </div>
        )}
        {footerSlot && !collapsed && <div className="pt-space-4">{footerSlot}</div>}
      </div>

      {/* The person and help, on their own bar at the bottom. */}
      {(account || help || footerIcons.length > 0) && (
        <div className={`flex shrink-0 items-center gap-space-2 py-space-5 shadow-rule-t ${collapsed ? "flex-col" : ""}`}>
          {account && <div className="min-w-0 flex-1">{account(collapsed)}</div>}
          {footerIcons.map((item) => renderIcon(item))}
          {help?.onOpen && <IconButton icon="question-circle" size="md" label={help.label} onClick={help.onOpen} />}
          {help && !help.onOpen && (
            <a href={help.href} target="_blank" rel="noopener noreferrer" aria-label={help.label} title={help.label}
              className="grid size-9 shrink-0 place-items-center rounded-lg text-text-muted">
              <Icon name="question-circle" size={18} />
            </a>
          )}
        </div>
      )}
    </nav>
  );
}

function CollapseButton({
  collapsed,
  labels,
  onClick,
}: {
  collapsed: boolean;
  labels: { collapse: string; expand: string };
  onClick: () => void;
}) {
  const label = collapsed ? labels.expand : labels.collapse;
  // The chevron points the way the panel will move: toward the reading start
  // to collapse, and it turns half a circle to point back once collapsed.
  // The icon set mirrors it in Arabic on its own.
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={!collapsed}
      title={`${label} — [`}
      className="grid size-ctl-xs shrink-0 place-items-center rounded-md text-text-muted transition-colors"
    >
      <Icon name="angle-double-left" size={16} className={`transition-[rotate] duration-base ${collapsed ? "rotate-180" : ""}`} />
    </button>
  );
}
