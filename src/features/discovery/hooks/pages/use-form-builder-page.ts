"use client";

import { useBrandPage } from "@/contexts/pageGuards";
import { PAGE_SECTIONS } from "../../constants";

/** /w/[slug]/forms/[formId]/edit: the question builder. */
export function useFormBuilderPage(slug: string, formId: string) {
  const page = useBrandPage(slug);
  if (!page) return null;
  const { workspace, isAr } = page;
  return {
    isAr,
    shell: { workspace, section: PAGE_SECTIONS.forms.en, arSection: PAGE_SECTIONS.forms.ar, width: "wide" as const },
    view: { formId, sendHref: `/w/${workspace.slug}/forms/${formId}/send`, isAr },
  };
}
