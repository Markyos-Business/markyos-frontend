"use client";

import { useState } from "react";
import { useBrandPage } from "@/contexts/pageGuards";
import type { TopBarTab } from "@/components/layout";
import { PAGE_SECTION, TABS, type VisualIdentityTab } from "../constants";

/** Visual identity: which tab is open, and which tabs hold nothing yet. */
export function useVisualIdentityPage(slug: string) {
  const page = useBrandPage(slug);
  const [tab, setTab] = useState<VisualIdentityTab>("files");
  if (!page) return null;
  const ws = page.workspace;

  /**
   * Which tabs hold nothing yet.
   *
   * Four of these eight are asset grids that are empty in most workspaces, and
   * from the tab row they looked exactly like the four that are full. This is
   * the same count the Overview's Brand insights card reports, read from the
   * same fields, so the two cannot disagree.
   */
  const countOf = (type: string) => ws.assets.filter((a) => a.type === type).length;
  const emptyTabs: Record<VisualIdentityTab, boolean> = {
    files: ws.assets.length === 0,
    logo: Object.values(ws.logo).every((s) => s.phase !== "attached"),
    color: ws.colors.length === 0,
    typography: !ws.typography.latinFamily && !ws.typography.arabicFamily,
    patterns: countOf("pattern") === 0,
    graphics: countOf("graphic") === 0,
    illustrations: countOf("illustration") === 0,
    icons: countOf("icon") === 0,
  };

  const tabs: TopBarTab[] = TABS.map((t) => ({
    key: t.key,
    label: t.label,
    arLabel: t.arLabel,
    active: tab === t.key,
    empty: emptyTabs[t.key],
    onSelect: () => setTab(t.key),
  }));

  return {
    shell: { workspace: ws, section: PAGE_SECTION.en, arSection: PAGE_SECTION.ar, tabs, width: "full" as const },
    view: { ws, tab, onTab: setTab },
  };
}
