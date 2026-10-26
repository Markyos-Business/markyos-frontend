"use client";

import { useBrandPage } from "@/contexts/pageGuards";
import { callHref } from "../../components/DiscoveryView";
import { PAGE_SECTION } from "../../constants";

/** /w/[slug]/discovery/calls/new: add call notes. */
export function useNewCallNotePage(slug: string) {
  const page = useBrandPage(slug);
  if (!page) return null;
  const { workspace, isAr } = page;
  return {
    isAr,
    shell: { workspace, section: PAGE_SECTION.en, arSection: PAGE_SECTION.ar, width: "wide" as const },
    view: {
      brandId: workspace.id,
      team: workspace.team,
      noteHref: (id: string) => callHref(workspace.slug, id),
      backHref: `/w/${workspace.slug}/discovery`,
      isAr,
    },
  };
}
