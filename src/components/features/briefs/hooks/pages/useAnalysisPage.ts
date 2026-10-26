"use client";

import { useBrandPage } from "@/contexts/pageGuards";
import { PAGE_SECTION } from "../../constants";

/** /w/[slug]/analysis: the brand's brief analysis. */
export function useAnalysisPage(slug: string) {
  const page = useBrandPage(slug);
  if (!page) return null;
  const { workspace, isAr } = page;
  return {
    isAr,
    shell: { workspace, section: PAGE_SECTION.en, arSection: PAGE_SECTION.ar, width: "wide" as const },
    view: { brandId: workspace.id, brandSlug: workspace.slug, isAr },
  };
}
