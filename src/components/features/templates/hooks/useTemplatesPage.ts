"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/components/ui";
import { TEMPLATES, type Template } from "../constants";

/** The template marketplace: the templates, and starting a brand from one. */
export function useTemplatesPage() {
  const { state, hydrated, createWorkspace, addColor, setTypography, setOverview } = useApp();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !state.session) router.replace("/login");
  }, [hydrated, state.session, router]);

  if (!hydrated || !state.session) return null;

  function apply(t: Template) {
    const ws = createWorkspace(t.name);
    setOverview(ws.id, t.overview);
    setTypography(ws.id, { latinFamily: t.latinFamily, arabicFamily: t.arabicFamily });
    for (const c of t.colors) addColor(ws.id, { name: c.name, hex: c.hex });
    showToast(`Started "${t.name}" from a template.`, "success");
    router.push(`/w/${ws.slug}/overview`);
  }

  return { templates: TEMPLATES, onApply: apply };
}
