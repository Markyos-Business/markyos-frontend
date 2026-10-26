"use client";

import { useState } from "react";
import { useBrandPage } from "@/contexts/pageGuards";
import { COMPLIANCE_TABS, PAGE_SECTION, type ComplianceTab } from "../constants";

/** The compliance page: which checker is open. */
export function useCompliancePage(slug: string) {
  const page = useBrandPage(slug);
  const [tab, setTab] = useState<ComplianceTab>("colors");
  if (!page) return null;
  return {
    tab,
    ws: page.workspace,
    shell: {
      workspace: page.workspace,
      section: PAGE_SECTION.en,
      arSection: PAGE_SECTION.ar,
      width: "full" as const,
      tabs: COMPLIANCE_TABS.map((t) => ({ ...t, active: tab === t.key, onSelect: () => setTab(t.key) })),
    },
  };
}
