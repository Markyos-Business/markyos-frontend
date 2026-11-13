"use client";

import { useBrandPage } from "@/contexts/pageGuards";
import { PAGE_SECTIONS } from "../../constants";

/** /w/[slug]/forms: the brand's forms. */
export function useBrandFormsPage(slug: string) {
  const page = useBrandPage(slug);
  if (!page) return null;
  const { workspace, isAr } = page;
  return {
    isAr,
    shell: { workspace, section: PAGE_SECTIONS.forms.en, arSection: PAGE_SECTIONS.forms.ar },
    view: { brandId: workspace.id, newFormHref: `/w/${workspace.slug}/forms/new`, isAr },
  };
}
