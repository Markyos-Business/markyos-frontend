"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useStudioPage } from "@/contexts/pageGuards";
import { canEdit, roleOn } from "@/lib/data/access";
import type { DiscoveryForm } from "../../types";

/** /forms/new: a new form for any brand the studio can edit. */
export function useStudioNewFormPage() {
  const router = useRouter();
  const { myWorkspaces, state } = useApp();
  const { ready, isAr } = useStudioPage("/forms/new");
  if (!ready) return null;
  const brands = myWorkspaces.filter((w) => canEdit(roleOn(w, state.session)));
  return {
    isAr,
    view: {
      brands: brands.map((w) => ({ id: w.id, name: w.name })),
      isAr,
      onCreated: (form: DiscoveryForm) => router.push(`/w/${form.workspaceSlug}/forms/${form.id}/edit`),
      onCancel: () => router.push("/forms"),
    },
  };
}
