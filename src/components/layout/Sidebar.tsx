"use client";

import { usePathname } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { Workspace } from "@/types";
import { AppSidebar, SidebarItem } from "./AppSidebar";

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
  { key: "departments", label: "Departments", arLabel: "أقسام الشركة", icon: "book", href: "/departments" },
  { key: "builder", label: "Guidelines editor", arLabel: "محرر الدليل", icon: "layer-group", href: "/builder" },
];

const GOVERN_NAV: NavItem[] = [
  { key: "drafts", label: "Drafts", arLabel: "المسودات", icon: "inbox", href: "/drafts" },
  { key: "type-lab", label: "Type sandbox", arLabel: "مختبر الخطوط", icon: "sliders", href: "/type-lab" },
  { key: "compliance", label: "Compliance", arLabel: "المطابقة", icon: "shield-alt", href: "/compliance" },
  { key: "team", label: "Team & history", arLabel: "الفريق والإصدارات", icon: "users", href: "/team" },
];

/** A brand's navigation: its book, its governance and its settings. */
export function Sidebar({ workspace }: { workspace: Workspace }) {
  const pathname = usePathname();
  const base = `/w/${workspace.slug}`;
  const { uiLang } = useApp();
  const isAr = uiLang(workspace) === "ar";

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

  function toItem(item: NavItem): SidebarItem {
    const href = `${base}${item.href}`;
    return {
      key: item.key,
      label: isAr ? item.arLabel : item.label,
      icon: item.icon,
      href: item.href === "" ? `${base}/overview` : href,
      active: item.href === "" ? pathname === base || pathname === `${base}/overview` : pathname.startsWith(href),
      badge: badgeFor(item.key),
    };
  }

  return (
    <AppSidebar
      label={isAr ? "تنقل العلامة" : "Brand"}
      title={workspace.name}
      titleHref="/brands"
      storageKey="markyos:ui:sidebar-collapsed"
      isAr={isAr}
      collapseLabels={
        isAr ? { collapse: "طيّ القائمة", expand: "توسيع القائمة" } : { collapse: "Collapse sidebar", expand: "Expand sidebar" }
      }
      // Named so a sweep can assert where this rail is *not* rendered. The
      // guidelines editor runs without it — see `focused` in the workspace
      // layout — and "the studio nav is absent on that route" is a claim worth
      // holding to account, because it is the whole reason that editor has a
      // canvas worth looking at.
      rootProps={{ "data-studio-nav": "" }}
      sections={[
        { key: "book", label: isAr ? "دليل الهوية" : "Brand book", items: BOOK_NAV.map(toItem) },
        { key: "govern", label: isAr ? "الحوكمة" : "Governance", items: GOVERN_NAV.map(toItem) },
      ]}
      footer={[
        {
          key: "settings",
          label: isAr ? "الإعدادات" : "Settings",
          icon: "cog",
          href: `${base}/settings`,
          active: pathname === `${base}/settings`,
        },
      ]}
    />
  );
}
