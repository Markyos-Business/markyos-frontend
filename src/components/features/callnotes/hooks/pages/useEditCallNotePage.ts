"use client";

import { useBrandPage } from "@/contexts/pageGuards";
import { callHref } from "../../components/DiscoveryView";
import { PAGE_SECTION } from "../../constants";
import { useCallNote } from "../useCallNote";

/** /w/[slug]/discovery/calls/[noteId]/edit: edit a call note, once it's loaded. */
export function useEditCallNotePage(slug: string, noteId: string) {
  const { data: note } = useCallNote(noteId);
  const page = useBrandPage(slug);
  if (!page) return null;
  const { workspace, isAr } = page;
  return {
    isAr,
    shell: { workspace, section: PAGE_SECTION.en, arSection: PAGE_SECTION.ar, width: "wide" as const },
    view: note
      ? {
          brandId: workspace.id,
          team: workspace.team,
          note,
          noteHref: (id: string) => callHref(workspace.slug, id),
          backHref: `/w/${workspace.slug}/discovery`,
          isAr,
        }
      : null,
  };
}
