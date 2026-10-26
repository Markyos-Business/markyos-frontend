"use client";

import { useBrandPage } from "@/contexts/pageGuards";
import { callHref } from "../../components/DiscoveryView";
import { PAGE_SECTION } from "../../constants";

/** /w/[slug]/discovery/calls/[noteId]: one call note. */
export function useCallNotePage(slug: string, noteId: string) {
  const page = useBrandPage(slug);
  if (!page) return null;
  const { workspace, isAr } = page;
  return {
    isAr,
    shell: { workspace, section: PAGE_SECTION.en, arSection: PAGE_SECTION.ar },
    view: { noteId, editHref: `${callHref(workspace.slug, noteId)}/edit`, backHref: `/w/${workspace.slug}/discovery`, isAr },
  };
}
