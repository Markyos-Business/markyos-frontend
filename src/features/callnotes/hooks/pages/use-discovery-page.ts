"use client";

import { useBrandPage } from "@/contexts/pageGuards";
import { PAGE_SECTION } from "../../constants";

/** /w/[slug]/discovery: forms and calls on one timeline. */
export function useDiscoveryPage(slug: string) {
  const page = useBrandPage(slug);
  if (!page) return null;
  const { workspace, isAr } = page;
  return {
    isAr,
    shell: { workspace, section: PAGE_SECTION.en, arSection: PAGE_SECTION.ar },
    view: { brandId: workspace.id, brandSlug: workspace.slug, isAr },
  };
}
