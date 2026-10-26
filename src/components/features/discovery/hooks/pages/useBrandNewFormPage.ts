"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useBrandPage } from "@/contexts/pageGuards";
import { canEdit, roleOn } from "@/lib/data/access";
import { PAGE_SECTIONS } from "../../constants";
import type { DiscoveryForm } from "../../types";

/** /w/[slug]/forms/new: a new form, this brand chosen. */
export function useBrandNewFormPage(slug: string) {
  const router = useRouter();
  const { myWorkspaces, state } = useApp();
  const page = useBrandPage(slug);
  if (!page) return null;
  const { workspace, isAr } = page;
  const brands = myWorkspaces.filter((w) => canEdit(roleOn(w, state.session)));
  return {
    isAr,
    shell: { workspace, section: PAGE_SECTIONS.newForm.en, arSection: PAGE_SECTIONS.newForm.ar },
    view: {
      brands: brands.map((w) => ({ id: w.id, name: w.name })),
      defaultBrandId: workspace.id,
      isAr,
      onCreated: (form: DiscoveryForm) => router.push(`/w/${form.workspaceSlug}/forms/${form.id}/edit`),
      onCancel: () => router.push(`/w/${workspace.slug}/forms`),
    },
  };
}
