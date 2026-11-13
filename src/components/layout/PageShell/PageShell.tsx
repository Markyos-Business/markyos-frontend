"use client";

import { TabPanel, useTabIds } from "@/components/ui";
import type { ReactNode } from "react";
import type { Workspace } from "@/types";
import { PageContainer } from "../PageContainer";
import { TopBar, type TopBarTab } from "../TopBar";

type PageShellProps = {
  workspace: Workspace;
  section: string;
  arSection?: string;
  right?: ReactNode;
  tabs?: TopBarTab[];
  tabsRight?: ReactNode;
  /** `full` leaves the body to the page: a canvas, a split view. */
  width?: "default" | "wide" | "full";
  /** Shown instead of the page in the browser-only build, for pages that need the server. */
  offline?: ReactNode;
  /** False drops the top bar, for a page that has taken the whole window (a board in full screen). */
  topBar?: boolean;
  children: ReactNode;
};

/** A brand page: its top bar, then the scrolling body. */
export function PageShell({ workspace, section, arSection, right, tabs, tabsRight, width = "default", offline, topBar = true, children }: PageShellProps) {
  const ids = useTabIds();
  const active = tabs?.find(tab => tab.active)?.key ?? tabs?.[0]?.key;
  const content = width === "full" ? children : <PageContainer width={width} offline={offline}>{children}</PageContainer>;
  return (
    <>
      {topBar && <TopBar workspace={workspace} section={section} arSection={arSection} right={right} tabs={tabs} tabsRight={tabsRight} tabsId={ids.id} panelId={ids.panelId} />}
      {active ? <TabPanel id={ids.panelId} tabsId={ids.id} active={active} className="flex min-h-0 flex-1 flex-col overflow-hidden">{content}</TabPanel> : content}
    </>
  );
}
