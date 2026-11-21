"use client";

import { useBrandPage } from "@/contexts/pageGuards";
import { useUrlTab } from "@/hooks/useUrlTab";
import type { TopBarTab } from "@/features/shell";
import { PAGE_SECTION } from "../../constants";

const TABS = ["questionnaires", "calls", "analysis"] as const;
export type DiscoveryTab = (typeof TABS)[number];

const LABELS: Record<DiscoveryTab, [string, string]> = {
  questionnaires: ["Questionnaire", "الاستبيان"],
  calls: ["Call notes", "ملاحظات المكالمات"],
  // Analysis reads the two tabs before it, so it lives beside them (it used to be its own page, /analysis).
  analysis: ["Analysis", "التحليل"],
};

/** /w/[slug]/discovery: the questionnaire, the call notes, and the analysis that reads them. */
export function useDiscoveryPage(slug: string) {
  const page = useBrandPage(slug);
  const [tab, setTab] = useUrlTab<DiscoveryTab>(TABS, "questionnaires");
  if (!page) return null;
  const { workspace, isAr } = page;
  const tabs: TopBarTab[] = TABS.map((key) => ({
    key,
    label: LABELS[key][0],
    arLabel: LABELS[key][1],
    active: tab === key,
    onSelect: () => setTab(key),
  }));
  return {
    isAr,
    tab,
    shell: { workspace, section: PAGE_SECTION.en, arSection: PAGE_SECTION.ar, tabs, width: tab === "analysis" ? ("wide" as const) : ("default" as const) },
    view: { brandId: workspace.id, brandSlug: workspace.slug, isAr, section: tab === "calls" ? ("calls" as const) : ("questionnaires" as const) },
    analysis: { brandId: workspace.id, brandSlug: workspace.slug, isAr, workspace },
  };
}
