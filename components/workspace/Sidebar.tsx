"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useApp } from "@/lib/store";
import { useLocalPref } from "@/lib/useLocalPref";
import { useNarrowViewport } from "@/lib/useNarrowViewport";
import { Workspace } from "@/lib/types";

interface NavItem {
  key: string;
  label: string;
  arLabel: string;
  icon: string;
  href: string;
}

const BOOK_NAV: NavItem[] = [
  { key: "overview", label: "Overview", arLabel: "نظرة عامة", icon: "file-alt", href: "" },
  // First in the list because it is first in the work: the brief goes out
  // before any design decision, and a nav that buries it teaches the opposite.
  { key: "brief", label: "Discovery brief", arLabel: "موجز التعريف", icon: "clipboard-list", href: "/brief" },
  { key: "moodboard", label: "Moodboard", arLabel: "لوح الإلهام", icon: "image", href: "/moodboard" },
  { key: "visual-identity", label: "Visual identity", arLabel: "الهوية البصرية", icon: "shapes", href: "/visual-identity" },
  { key: "strategy", label: "Strategy", arLabel: "الاستراتيجية", icon: "bullseye", href: "/strategy" },
  { key: "departments", label: "Company departments", arLabel: "أقسام الشركة", icon: "book", href: "/departments" },
  { key: "builder", label: "Guidelines editor", arLabel: "محرر الدليل", icon: "layer-group", href: "/builder" },
];

const GOVERN_NAV: NavItem[] = [
  { key: "drafts", label: "Drafts", arLabel: "المسودات", icon: "inbox", href: "/drafts" },
  { key: "type-lab", label: "Type sandbox", arLabel: "مختبر الخطوط", icon: "sliders", href: "/type-lab" },
  { key: "compliance", label: "Compliance", arLabel: "المطابقة", icon: "shield-alt", href: "/compliance" },
  { key: "team", label: "Team & history", arLabel: "الفريق والإصدارات", icon: "users", href: "/team" },
];

/*
 * 248, not 232.
 *
 * At 232 the longest item in the nav — "Company departments", next to its
 * count — needed 140px and had 137, so the primary navigation label was
 * ellipsed on every page of the app, with no title to recover it from. A nav
 * item is the one string that has to be readable before you know what it says:
 * truncating it means choosing a destination from a word and a half. 16px of
 * rail buys 13px of headroom on that label, which is enough that a different
 * font rendering will not put it back.
 */
const OPEN_W = 248;
const RAIL_W = 60;

export function Sidebar({ workspace }: { workspace: Workspace }) {
  const pathname = usePathname();
  const base = `/w/${workspace.slug}`;
  const { uiLang } = useApp();
  const isAr = uiLang(workspace) === "ar";
  const settingsActive = pathname === `${base}/settings`;
  const [preference, setCollapsed] = useLocalPref("markyos:ui:sidebar-collapsed", false);
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

  const filledSlots = Object.values(workspace.logo).filter((s) => s.phase === "attached").length;

  function badgeFor(key: string): string | number | undefined {
    if (key === "visual-identity") return `${filledSlots}/3`;
    if (key === "builder") {
      const total = workspace.customBlocks.length + workspace.pages.reduce((n, p) => n + p.blocks.length, 0);
      return total || undefined;
    }
    if (key === "departments") return workspace.departmentViews.length || undefined;
    // A queue nobody can see the depth of is a queue that stops being worked.
    if (key === "drafts") return workspace.drafts.filter((d) => d.status === "pending").length || undefined;
    if (key === "moodboard") {
      return (
        workspace.moodboards.reduce(
          (n, b) => n + b.zones.reduce((z, zone) => z + zone.items.length, 0),
          0,
        ) || undefined
      );
    }
    // Briefs that are out and not yet submitted — the ones still waiting on
    // someone else, which is the number worth surfacing.
    if (key === "brief") {
      return (
        workspace.briefs.filter((b) => !b.revokedAt && (b.status === "sent" || b.status === "in_progress")).length ||
        undefined
      );
    }
    if (key === "team") {
      const pending = workspace.approvals.filter((a) => a.status === "pending").length;
      return pending || undefined;
    }
    return undefined;
  }

  function isActive(item: NavItem): boolean {
    const href = `${base}${item.href}`;
    return item.href === "" ? pathname === base || pathname === `${base}/overview` : pathname.startsWith(href);
  }

  function renderItem(item: NavItem) {
    const active = isActive(item);
    const badge = badgeFor(item.key);
    const label = isAr ? item.arLabel : item.label;
    return (
      <Link
        key={item.key}
        href={item.href === "" ? `${base}/overview` : `${base}${item.href}`}
        // The title is the only thing naming this item once the rail is
        // collapsed, so it carries the badge too — otherwise "3 pending
        // approvals" becomes an unexplained dot.
        title={collapsed ? (badge !== undefined ? `${label} — ${badge}` : label) : undefined}
        aria-label={collapsed ? label : undefined}
        className={`mk-nav-item relative flex items-center rounded-lg py-2.5 text-[13px] transition-colors ${
          collapsed ? "justify-center px-0" : "gap-2.5 px-2.5"
        }`}
        style={{
          background: active ? "var(--surface-2)" : "transparent",
          color: active ? "var(--text)" : "var(--text-muted)",
          fontWeight: active ? 500 : 400,
          fontFamily: isAr ? "var(--font-arabic)" : "var(--font-sans)",
        }}
      >
        <Icon name={item.icon} size={18} style={{ color: active ? "var(--accent)" : undefined, flexShrink: 0 }} />
        {collapsed ? (
          // A count can't be read at 60px wide, so it becomes a presence
          // marker: something is waiting here. The title says what.
          badge !== undefined && (
            <span
              aria-hidden
              className="absolute top-1.5 w-1.5 h-1.5 rounded-full"
              style={{ insetInlineEnd: 10, background: "var(--accent)" }}
            />
          )
        ) : (
          <>
            <span className="flex-1 truncate">{label}</span>
            {badge !== undefined && (
              <span
                className="text-[10px] font-medium shrink-0"
                style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-faint)" }}
              >
                {badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  }

  function groupLabel(en: string, ar: string) {
    if (collapsed) {
      // A heading with nothing legible under it is noise; the rule keeps the
      // two groups visibly separate without pretending to be a label.
      return <div className="mx-3 mb-1.5 h-px shrink-0" style={{ background: "var(--hairline)" }} />;
    }
    return (
      <div
        className="text-[11px] font-medium uppercase px-2 pb-2.5 truncate"
        style={{ letterSpacing: "0.1em", color: "var(--text-faint)" }}
      >
        {isAr ? ar : en}
      </div>
    );
  }

  return (
    <div
      // Named so a sweep can assert where this rail is *not* rendered. The
      // guidelines editor runs without it — see `focused` in the workspace
      // layout — and "the studio nav is absent on that route" is a claim worth
      // holding to account, because it is the whole reason that editor has a
      // canvas worth looking at.
      data-studio-nav=""
      className="shrink-0 flex flex-col gap-6 py-5 overflow-y-auto overflow-x-hidden"
      style={{
        width: collapsed ? RAIL_W : OPEN_W,
        paddingInline: collapsed ? 8 : 16,
        // Width is the only thing that animates. Fading the labels as well
        // reads as the panel hesitating; they simply aren't there at the other
        // size, and the eye follows the edge, not the text.
        transition: "width 200ms cubic-bezier(0.2, 0.7, 0.3, 1), padding-inline 200ms cubic-bezier(0.2, 0.7, 0.3, 1)",
        boxShadow: isAr ? "inset 1px 0 0 var(--hairline)" : "inset -1px 0 0 var(--hairline)",
      }}
    >
      <div className={`flex items-center shrink-0 ${collapsed ? "justify-center" : "gap-2.5 px-2"}`}>
        <Link
          href="/brands"
          // In the rail the mark is all there is, and an 18px-wide logo is an
          // 18px-wide target — so the link keeps a full-size hit area of its
          // own rather than shrink-wrapping the image.
          className={`mk-tap gap-2.5 min-w-0 ${collapsed ? "justify-center min-w-[32px] min-h-[32px]" : ""}`}
          title={collapsed ? workspace.name : undefined}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/markyos-mark.svg"
            alt="Markyos"
            style={{ filter: "var(--chrome-mark-invert)", height: 22, width: "auto", flexShrink: 0 }}
          />
          {!collapsed && (
            <span
              className="flex-1 font-semibold text-[15px] tracking-tight truncate"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {workspace.name}
            </span>
          )}
        </Link>
        {!collapsed && (
          <CollapseButton collapsed={collapsed} isAr={isAr} onClick={() => setCollapsed(true)} />
        )}
      </div>

      {/* No expand control while the viewport is what's forcing the rail —
          a button that does nothing is worse than no button. */}
      {collapsed && !narrow && (
        <div className="flex justify-center shrink-0 -mt-3">
          <CollapseButton collapsed={collapsed} isAr={isAr} onClick={() => setCollapsed(false)} />
        </div>
      )}

      <div className="flex flex-col gap-0.5">
        {groupLabel("Brand book", "دليل الهوية")}
        {BOOK_NAV.map(renderItem)}
      </div>

      <div className="flex flex-col gap-0.5">
        {groupLabel("Governance", "الحوكمة")}
        {GOVERN_NAV.map(renderItem)}
      </div>

      <Link
        href={`${base}/settings`}
        title={collapsed ? (isAr ? "الإعدادات" : "Settings") : undefined}
        className={`mk-nav-item mt-auto flex items-center rounded-lg py-2.5 text-[13px] shrink-0 ${
          collapsed ? "justify-center px-0" : "gap-2.5 px-2.5"
        }`}
        style={{
          background: settingsActive ? "var(--surface-2)" : "transparent",
          color: settingsActive ? "var(--text)" : "var(--text-muted)",
          fontWeight: settingsActive ? 500 : 400,
        }}
      >
        <Icon name="cog" size={18} style={{ color: settingsActive ? "var(--accent)" : undefined, flexShrink: 0 }} />
        {!collapsed && <span className="truncate">{isAr ? "الإعدادات" : "Settings"}</span>}
      </Link>
    </div>
  );
}

function CollapseButton({
  collapsed,
  isAr,
  onClick,
}: {
  collapsed: boolean;
  isAr: boolean;
  onClick: () => void;
}) {
  const label = collapsed ? (isAr ? "توسيع القائمة" : "Expand sidebar") : isAr ? "طيّ القائمة" : "Collapse sidebar";
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
      className="h-7 w-7 rounded-md grid place-items-center cursor-pointer shrink-0 transition-colors"
      style={{ color: "var(--text-faint)" }}
    >
      <Icon name={pointsStart ? "angle-double-left" : "angle-double-right"} size={13} />
    </button>
  );
}
