"use client";

import { useBrandPage } from "@/contexts/pageGuards";
import { PAGE_SECTIONS } from "../../constants";

/** /w/[slug]/forms/[formId]/answers: what the client said. */
export function useFormAnswersPage(slug: string, formId: string) {
  const page = useBrandPage(slug);
  if (!page) return null;
  const { workspace, isAr } = page;
  const base = `/w/${workspace.slug}/forms/${formId}`;
  return {
    isAr,
    shell: { workspace, section: PAGE_SECTIONS.forms.en, arSection: PAGE_SECTIONS.forms.ar, width: "wide" as const },
    view: { formId, builderHref: `${base}/edit`, sendHref: `${base}/send`, strategyHref: `/w/${workspace.slug}/strategy`, isAr },
    relatedCalls: { brandId: workspace.id, brandSlug: workspace.slug, formId, isAr },
    analysis: { href: `/w/${workspace.slug}/analysis`, isAr },
  };
}
