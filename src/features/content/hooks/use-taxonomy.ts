"use client";

import { useRequest } from "@/hooks/useRequest";
import { listAuthors, listCategories, listTags } from "../api/content.api";

/** Authors, categories and tags, for the editor's pickers. */
export function useTaxonomy() {
  return useRequest(
    () => Promise.all([listAuthors(), listCategories(), listTags()]).then(([authors, categories, tags]) => ({ authors, categories, tags })),
    "content-taxonomy",
  );
}
