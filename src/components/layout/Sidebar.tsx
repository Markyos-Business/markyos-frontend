"use client";

import { usePathname } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import type { Workspace } from "@/types";
import { AppSidebar, type SidebarItem } from "./AppSidebar";
import { SIDEBAR_RAILS } from "@/lib/sidebarRails";
import { roleOn } from "@/lib/data/access";
import { API_ENABLED } from "@/lib/api/client";
import { canOpenBrandPage, publishedGuidelineHref } from "@/lib/data/brandNavigation";

type Item = { key: string; label: string; arLabel: string; icon: string; path: string; api?: boolean };
const groups = [
  { key: "identity", label: "Brand identity", arLabel: "هوية العلامة", items: [
    { key: "overview", label: "Overview", arLabel: "نظرة عامة", icon: "file-alt", path: "overview" },
    { key: "assets", label: "Assets", arLabel: "الأصول", icon: "file-alt", path: "assets" },
    { key: "visual-identity", label: "Visual identity", arLabel: "الهوية البصرية", icon: "shapes", path: "visual-identity" },
  ] },
  { key: "strategy", label: "Strategy", arLabel: "الاستراتيجية", items: [
    { key: "strategy", label: "Strategy", arLabel: "الاستراتيجية", icon: "bullseye", path: "strategy" },
    { key: "departments", label: "Departments", arLabel: "الأقسام", icon: "book", path: "departments" },
  ] },
  { key: "site", label: "Guideline site", arLabel: "موقع الدليل", items: [
    { key: "builder", label: "Guidelines editor", arLabel: "محرر الدليل", icon: "layer-group", path: "builder" },
  ] },
  { key: "research", label: "Research", arLabel: "البحث", items: [
    { key: "discovery", label: "Discovery", arLabel: "الاستكشاف", icon: "clipboard-list", path: "discovery", api: true },
    { key: "analysis", label: "Analysis", arLabel: "التحليل", icon: "chart-line", path: "analysis", api: true },
    { key: "moodboard", label: "Moodboard", arLabel: "لوح الإلهام", icon: "image", path: "moodboard" },
  ] },
  { key: "tools", label: "Tools", arLabel: "الأدوات", items: [
    { key: "drafts", label: "Drafts", arLabel: "المسودات", icon: "inbox", path: "drafts" },
    { key: "type-lab", label: "Type sandbox", arLabel: "مختبر الخطوط", icon: "sliders", path: "type-lab" },
    { key: "compliance", label: "Compliance", arLabel: "المطابقة", icon: "shield-alt", path: "compliance" },
  ] },
] satisfies { key: string; label: string; arLabel: string; items: Item[] }[];

export function Sidebar({ workspace }: { workspace: Workspace }) {
  const pathname = usePathname();
  const { uiLang, state } = useApp();
  const isAr = uiLang(workspace) === "ar";
  const role = roleOn(workspace, state.session);
  const isClient = role === "client";
  const base = `/w/${workspace.slug}`;
  const reviewHref = isClient ? publishedGuidelineHref(workspace) : null;
  const toItem = (item: Item): SidebarItem => ({
    key: item.key, label: isAr ? item.arLabel : item.label, icon: item.icon, href: `${base}/${item.path}`,
    active: pathname === `${base}/${item.path}` || pathname.startsWith(`${base}/${item.path}/`) || (item.key === "discovery" && pathname.startsWith(`${base}/forms`)),
    badge: item.key === "assets" ? workspace.assets.length || undefined : item.key === "drafts" ? workspace.drafts.filter(draft => draft.status === "pending").length || undefined : undefined,
  });
  const sections = groups.map(group => ({ key: group.key, label: isAr ? group.arLabel : group.label,
    items: group.items.filter((item: Item) => (!item.api || API_ENABLED) && canOpenBrandPage(role, `${base}/${item.path}`, workspace.slug)).map(toItem),
  })).filter(group => group.items.length > 0);
  return <AppSidebar label={isClient ? (isAr ? "مراجعة العلامة" : "Brand review") : (isAr ? "تنقل العلامة" : "Brand")}
    title={workspace.name} titleHref="/brands" storageKey={SIDEBAR_RAILS.studio} isAr={isAr}
    collapseLabels={isAr ? {collapse:"طيّ القائمة",expand:"توسيع القائمة"} : {collapse:"Collapse sidebar",expand:"Expand sidebar"}}
    rootProps={{"data-studio-nav":""}} sections={sections}
    footerSlot={isClient && !reviewHref ? <p className="px-space-2 text-caption text-text-muted">{isAr ? "اطلب من مالك العلامة رابط الدليل للمراجعة." : "Ask the brand owner for a guideline review link."}</p> : undefined}
    footer={[
      ...(reviewHref ? [{key:"review-guideline",label:isAr?"مراجعة الدليل":"Review guideline",icon:"eye",href:reviewHref}] : []),
      toItem({key:"team",label:"Team & history",arLabel:"الفريق والإصدارات",icon:"users",path:"team"}),
      toItem({key:"settings",label:"Settings",arLabel:"الإعدادات",icon:"cog",path:"settings"}),
    ]} />;
}
