"use client";

import { Breadcrumb, TabIndicator, tabButtonId } from "@/components/ui";
import { useTabNavigation } from "@/components/ui";
import { NotificationBell } from "@/features/notifications";
import { SidebarMenuButton } from "@/components/ui";
import { useAppActions } from "@/contexts/AppContext";
import type { Workspace } from "@/types";
import { useEffect, type ReactNode } from "react";

export interface TopBarTab {
  key: string;
  label: string;
  arLabel: string;
  active: boolean;
  onSelect: () => void;
  empty?: boolean;
}

/** Brand breadcrumb, one global account menu, then page actions and sections. */
export function TopBar({ workspace, section, arSection, right, tabs, tabsRight, tabsId, panelId }: {
  workspace: Workspace; section: string; arSection?: string; right?: ReactNode;
  tabs?: TopBarTab[]; tabsRight?: ReactNode; tabsId: string; panelId: string;
}) {
  const { uiLang } = useAppActions();
  const isAr = uiLang(workspace) === "ar";
  const active = tabs?.find(tab => tab.active)?.key ?? tabs?.[0]?.key ?? "";
  const { row, tabProps } = useTabNavigation({ tabs: tabs ?? [], active, onChange: key => tabs?.find(tab => tab.key === key)?.onSelect() });
  // Below lg the tabs are one scrolling row; keep the open one in sight (a deep link to the tenth tab).
  useEffect(() => {
    row.current?.querySelector<HTMLElement>(`[data-tab-key="${CSS.escape(active)}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active, row]);
  return (
    // One banner for the breadcrumb, the page actions and the section tabs, so
    // none of them sits outside a landmark.
    <header className="flex shrink-0 flex-col">
      <div className="mk-no-hover flex min-h-topbar items-center gap-ctl-row px-space-6 py-space-4 sm:px-space-10">
        <SidebarMenuButton />
        <Breadcrumb className="flex-1" label={isAr ? "مسار الصفحة" : "Breadcrumb"} items={[
          { label: workspace.name, href: `/w/${workspace.slug}/overview` },
          { label: isAr && arSection ? arSection : section },
        ]} />
        {/* The account sits at the bottom of the brand sidebar; the bell stays here. */}
        <NotificationBell isAr={isAr} />
      </div>
      {right && <div className="flex flex-wrap items-center gap-ctl-row px-space-6 pb-space-5 *:flex-wrap sm:px-space-10">{right}</div>}
      {!!tabs?.length && <div className="flex flex-wrap items-start gap-ctl-row px-space-6 pb-space-5 shadow-rule-b sm:px-space-10">
        {/* One row that scrolls on phones and tablets (Strategy has ten tabs); wraps from lg up. */}
        <div ref={row} id={tabsId} role="tablist" aria-label={isAr && arSection ? arSection : section} aria-orientation="horizontal" className="mk-tabs mk-no-hover flex min-w-0 flex-1 items-center gap-ctl-row overflow-x-auto pb-space-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
          {tabs.map(tab => <button key={tab.key} type="button" role="tab" id={tabButtonId(tabsId, tab.key)}
            aria-selected={tab.active} aria-controls={panelId} data-tab-key={tab.key} {...tabProps(tab.key)} onClick={tab.onSelect}
            className={`relative isolate flex h-control-sm shrink-0 cursor-pointer items-center gap-space-3 whitespace-nowrap rounded-lg px-space-4 text-body font-medium transition-colors ${tab.active ? "text-text" : "text-text-muted"}`}>
            {tab.active && <TabIndicator />}
            {isAr ? tab.arLabel : tab.label}
            {tab.empty && <span role="img" aria-label={isAr ? "لا يوجد محتوى بعد" : "Nothing here yet"} title={isAr ? "لا يوجد محتوى بعد" : "Nothing here yet"} className="size-1.5 shrink-0 rounded-full shadow-[inset_0_0_0_1.5px_var(--text-faint)]" />}
          </button>)}
        </div>
        {tabsRight}
      </div>}
    </header>
  );
}
