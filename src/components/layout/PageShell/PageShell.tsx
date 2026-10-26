"use client";

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
  children: ReactNode;
};

/** A brand page: its top bar, then the scrolling body. */
export function PageShell({ workspace, section, arSection, right, tabs, tabsRight, width = "default", offline, children }: PageShellProps) {
  return (
    <>
      <TopBar workspace={workspace} section={section} arSection={arSection} right={right} tabs={tabs} tabsRight={tabsRight} />
      {width === "full" ? (
        children
      ) : (
        <PageContainer width={width} offline={offline}>
          {children}
        </PageContainer>
      )}
    </>
  );
}
