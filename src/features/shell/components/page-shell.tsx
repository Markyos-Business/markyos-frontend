"use client";

import { TabPanel, useTabIds } from "@/components/ui";
import type { ReactNode } from "react";
import type { Workspace } from "@/types";
import type { HelpScreen } from "@/features/helpcenter";
import { PageContainer } from "./page-container";
import { TopBar, type TopBarTab } from "./top-bar";

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
  /** The screen's ? button in the top bar (helpcenter help-map). */
  help?: HelpScreen;
  children: ReactNode;
};

/** A brand page: its top bar, then the scrolling body. */
export function PageShell({ workspace, section, arSection, right, tabs, tabsRight, width = "default", offline, topBar = true, help, children }: PageShellProps) {
  const ids = useTabIds();
  const active = tabs?.find(tab => tab.active)?.key ?? tabs?.[0]?.key;
  // Room under the top bar (or its tab row), so a contained page's title sits
  // where a full-width page's does: those pad their own top by 26px, tabs or not.
  // A full-width page still needs its main landmark (PageContainer has one):
  // without it a screen reader could not jump to the content.
  // One main landmark per page: the tab panel's when there are tabs, otherwise
  // the container's (or a plain one for a full-width page).
  const content = width === "full" ? children : <PageContainer width={width} offline={offline} spaced landmark={!active}>{children}</PageContainer>;
  return (
    <>
      {topBar && <TopBar workspace={workspace} section={section} arSection={arSection} right={right} tabs={tabs} tabsRight={tabsRight} tabsId={ids.id} panelId={ids.panelId} help={help} />}
      {active ? (
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <TabPanel id={ids.panelId} tabsId={ids.id} active={active} tabIndex={-1} className="flex min-h-0 flex-1 flex-col overflow-hidden">{content}</TabPanel>
        </main>
      ) : width === "full" ? <main className="flex min-h-0 flex-1 flex-col">{content}</main> : content}
    </>
  );
}
