"use client";

import { useStudioPage } from "@/contexts/pageGuards";

/** /forms: every form across the studio's brands. */
export function useStudioFormsPage() {
  const { ready, isAr } = useStudioPage("/forms");
  if (!ready) return null;
  return { isAr, view: { newFormHref: "/forms/new", isAr } };
}
