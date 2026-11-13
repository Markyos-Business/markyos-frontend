"use client";

import { TabIndicator, tabButtonId } from "@/components/ui";
import { useTabNavigation } from "@/components/ui";
import { AccountMenu } from "@/features/account";
import { SidebarMenuButton } from "@/components/ui";
import { useApp } from "@/contexts/AppContext";
import type { Workspace } from "@/types";
import type { ReactNode } from "react";

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
  const { uiLang } = useApp();
  const isAr = uiLang(workspace) === "ar";
  const active = tabs?.find(tab => tab.active)?.key ?? tabs?.[0]?.key ?? "";
  const { row, tabProps } = useTabNavigation({ tabs: tabs ?? [], active, onChange: key => tabs?.find(tab => tab.key === key)?.onSelect() });
  return (
    <div className="flex shrink-0 flex-col">
      <header className="flex min-h-topbar items-center gap-space-4 px-space-6 py-space-4 sm:px-space-10">
        <SidebarMenuButton />
        <nav aria-label={isAr ? "مسار الصفحة" : "Breadcrumb"} className="flex min-w-0 flex-1 items-center gap-space-3 text-body text-text-muted">
          <span className="truncate">{workspace.name}</span>
          <span aria-hidden>/</span>
          <span className="truncate text-text">{isAr && arSection ? arSection : section}</span>
        </nav>
        <AccountMenu isAr={isAr} />
      </header>
      {right && <div className="flex flex-wrap items-center gap-space-4 px-space-6 pb-space-5 *:flex-wrap sm:px-space-10">{right}</div>}
      {!!tabs?.length && <div className="flex flex-wrap items-start gap-space-3 px-space-6 pb-space-5 shadow-rule-b sm:px-space-10">
        <div ref={row} id={tabsId} role="tablist" aria-label={isAr && arSection ? arSection : section} aria-orientation="horizontal" className="flex min-w-0 flex-1 flex-wrap items-center gap-space-2">
          {tabs.map(tab => <button key={tab.key} type="button" role="tab" id={tabButtonId(tabsId, tab.key)}
            aria-selected={tab.active} aria-controls={panelId} data-tab-key={tab.key} {...tabProps(tab.key)} onClick={tab.onSelect}
            className={`relative isolate flex h-control-sm cursor-pointer items-center gap-space-3 whitespace-nowrap rounded-lg px-space-4 text-body font-medium transition-colors ${tab.active ? "text-text" : "text-text-muted hover:text-text"}`}>
            {tab.active && <TabIndicator />}
            {isAr ? tab.arLabel : tab.label}
            {tab.empty && <span role="img" aria-label={isAr ? "لا يوجد محتوى بعد" : "Nothing here yet"} title={isAr ? "لا يوجد محتوى بعد" : "Nothing here yet"} className="size-1.5 shrink-0 rounded-full shadow-[inset_0_0_0_1.5px_var(--text-faint)]" />}
          </button>)}
        </div>
        {tabsRight}
      </div>}
    </div>
  );
}
