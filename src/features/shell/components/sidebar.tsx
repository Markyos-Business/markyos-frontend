"use client";

import { memo } from "react";
import { usePathname } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import type { TeamRole, Workspace } from "@/types";
import { AppSidebar, type SidebarItem } from "@/components/ui";
import { AccountMenu } from "@/features/account";
import { useHelpPanel } from "@/features/helpcenter";
import { brandInitials, brandMarkSources } from "@/lib/data/brandSetup";
import { marketingHref } from "@/lib/marketing";
import { isLive } from "@/lib/data/publication";
import { BrandAvatarArt, BrandSwitcher } from "./brand-switcher";
import { SIDEBAR_RAILS } from "@/lib/sidebarRails";
import { roleOn } from "@/lib/data/access";
import { API_ENABLED } from "@/lib/api/client";
import { canOpenBrandPage, publishedGuidelineHref } from "@/lib/data/brandNavigation";

type Item = { key: string; label: string; arLabel: string; icon: string; path: string; api?: boolean };

/*
 * In the order of the work (decided 2026-11-21): what's waiting, then the
 * three stages a brand goes through. A new feature joins the stage it belongs
 * to instead of adding a group: Mockups goes in Build and deliver; Initiatives,
 * Kit and Brand health go in Run. Studio and company brands share this order,
 * so help pages, onboarding and screenshots stay the same for both.
 */
const groups = [
  { key: "top", label: "Brand", arLabel: "العلامة", heading: false, items: [
    { key: "overview", label: "Overview", arLabel: "نظرة عامة", icon: "th-large", path: "overview" },
    // One review queue for suggestions from every stage (brief, AI, imports, palettes), with its count.
    { key: "drafts", label: "Drafts", arLabel: "المسودات", icon: "inbox", path: "drafts" },
  ] },
  { key: "discover", label: "Discover and think", arLabel: "اكتشف وفكّر", heading: true, items: [
    // Holds Analysis as a tab (Questionnaire, Call notes, Analysis).
    { key: "discovery", label: "Discovery", arLabel: "الاكتشاف", icon: "clipboard-list", path: "discovery", api: true },
    { key: "strategy", label: "Strategy", arLabel: "الاستراتيجية", icon: "bullseye", path: "strategy" },
    { key: "moodboard", label: "Moodboard", arLabel: "لوحة الإلهام", icon: "image", path: "moodboard" },
  ] },
  { key: "build", label: "Build and deliver", arLabel: "ابنِ وسلّم", heading: true, items: [
    { key: "assets", label: "Assets", arLabel: "الأصول", icon: "file-alt", path: "assets" },
    // Holds the type sandbox as a tab beside Typography.
    { key: "visual-identity", label: "Visual identity", arLabel: "الهوية البصرية", icon: "shapes", path: "visual-identity" },
    // Opens the editor; the dot and the arrow are the public site.
    { key: "builder", label: "Guideline site", arLabel: "موقع الدليل", icon: "globe", path: "builder" },
  ] },
  { key: "run", label: "Run", arLabel: "أدِر", heading: true, items: [
    { key: "departments", label: "Departments", arLabel: "الأقسام", icon: "sitemap", path: "departments" },
    { key: "compliance", label: "Check", arLabel: "التدقيق", icon: "shield-alt", path: "compliance" },
  ] },
] satisfies { key: string; label: string; arLabel: string; heading: boolean; items: Item[] }[];

/**
 * The brand's sidebar.
 *
 * Reads the few values it shows out of the brand and hands them to a memoized
 * component, because the brand is a new object after every edit: typing one
 * character in the overview used to re-render every link and icon here.
 */
export function Sidebar({ workspace }: { workspace: Workspace }) {
  const pathname = usePathname();
  const { uiLang, state } = useApp();
  const role = roleOn(workspace, state.session);
  return (
    <BrandSidebar
      pathname={pathname}
      isAr={uiLang(workspace) === "ar"}
      role={role}
      slug={workspace.slug}
      id={workspace.id}
      name={workspace.name}
      reviewHref={role === "client" ? publishedGuidelineHref(workspace) : null}
      logo={brandMarkSources(workspace)}
      paid={workspace.billing.plan !== "free"}
      live={isLive(workspace)}
      // The same set the library lists: uploaded files plus the attached logo files.
      assetCount={workspace.assets.length + Object.values(workspace.logo).filter((slot) => slot?.phase === "attached").length}
      pendingDrafts={workspace.drafts.filter((draft) => draft.status === "pending").length}
    />
  );
}

type BrandSidebarProps = {
  pathname: string;
  isAr: boolean;
  role: TeamRole | null;
  slug: string;
  id: string;
  name: string;
  reviewHref: string | null;
  logo: { src: string; lightSrc?: string } | null;
  paid: boolean;
  live: boolean;
  assetCount: number;
  pendingDrafts: number;
};

const BrandSidebar = memo(function BrandSidebar({ pathname, isAr, role, slug, id, name, reviewHref, logo, paid, live, assetCount, pendingDrafts }: BrandSidebarProps) {
  const helpPanel = useHelpPanel();
  const isClient = role === "client";
  const base = `/w/${slug}`;
  const toItem = (item: Item): SidebarItem => ({
    key: item.key, label: isAr ? item.arLabel : item.label, icon: item.icon, href: `${base}/${item.path}`,
    active: pathname === `${base}/${item.path}` || pathname.startsWith(`${base}/${item.path}/`) || (item.key === "discovery" && pathname.startsWith(`${base}/forms`)),
    badge: item.key === "assets" ? assetCount || undefined : item.key === "drafts" ? pendingDrafts || undefined : undefined,
    ...(item.key === "builder" && live && !isClient
      ? { status: { tone: "success" as const, label: isAr ? "منشور" : "Live" }, external: { href: `/v/${slug}`, label: isAr ? "فتح موقع الدليل" : "Open the guideline site" } }
      : {}),
  });
  const sections = groups.map(group => ({ key: group.key, label: isAr ? group.arLabel : group.label, hideHeading: !group.heading,
    items: group.items.filter((item: Item) => (!item.api || API_ENABLED) && canOpenBrandPage(role, `${base}/${item.path}`, slug)).map(toItem),
  })).filter(group => group.items.length > 0);
  // A reviewer's way to the published guideline sits with the work, not in the bottom bar.
  if (reviewHref) sections[0]?.items.push({ key: "review-guideline", label: isAr ? "مراجعة الدليل" : "Review guideline", icon: "eye", href: reviewHref });
  return <AppSidebar label={isClient ? (isAr ? "مراجعة العلامة" : "Brand review") : (isAr ? "تنقل العلامة" : "Brand")}
    title={name} titleHref="/brands" storageKey={SIDEBAR_RAILS.studio} isAr={isAr}
    collapseLabels={isAr ? {collapse:"طيّ القائمة",expand:"توسيع القائمة"} : {collapse:"Collapse sidebar",expand:"Expand sidebar"}}
    rootProps={{"data-studio-nav":""}} sections={sections} headings
    avatar={logo ? <BrandAvatarArt sources={logo} /> : brandInitials(name)}
    subtitle={isClient ? (isAr ? "مراجعة" : "Review") : paid ? (isAr ? "خطة مدفوعة" : "Paid plan") : (isAr ? "خطة مجانية" : "Free plan")}
    switcher={<BrandSwitcher currentId={id} isAr={isAr} />}
    account={(collapsed) => <AccountMenu variant="row" compact={collapsed} isAr={isAr} />}
    help={{ href: marketingHref("/help", isAr ? "ar" : "en"), label: isAr ? "مركز المساعدة" : "Help centre", onOpen: helpPanel ? () => helpPanel.openHelp() : undefined }}
    footerSlot={isClient && !reviewHref ? <p className="px-space-2 text-caption text-text-muted">{isAr ? "اطلب من مالك العلامة رابط الدليل للمراجعة." : "Ask the brand owner for a guideline review link."}</p> : undefined}
    // Visited now and then, so icons beside the person rather than rows beside the work.
    footerIcons={[
      ...(API_ENABLED ? [{key:"notifications",label:isAr?"الإشعارات":"Notifications",icon:"bell",href:"/notifications",active:pathname === "/notifications"}] : []),
      toItem({key:"team",label:"Team",arLabel:"الفريق",icon:"users",path:"team"}),
      toItem({key:"settings",label:"Settings",arLabel:"الإعدادات",icon:"cog",path:"settings"}),
    ]} />;
});
