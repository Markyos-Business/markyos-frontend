"use client";

import { useApp } from "@/contexts/AppContext";
import { useBrandPage } from "@/contexts/pageGuards";
import { LOGO_LABELS, PAGE_SECTIONS } from "../../constants";
import type { LogoChoice } from "../../components/ThemeSendView";

/** /w/[slug]/forms/[formId]/send: the form's theme and link. */
export function useFormSendPage(slug: string, formId: string) {
  const { state } = useApp();
  const page = useBrandPage(slug);
  if (!page) return null;
  const { workspace, isAr } = page;
  // The brand's attached logo files; the public form resolves the same ids.
  const logos: LogoChoice[] = (Object.keys(LOGO_LABELS) as (keyof typeof LOGO_LABELS)[])
    .filter((key) => workspace.logo[key]?.phase === "attached" && workspace.logo[key]?.url)
    .map((key) => ({ id: `logo:${key}`, label: LOGO_LABELS[key][isAr ? "ar" : "en"], url: workspace.logo[key].url! }));
  const base = `/w/${workspace.slug}/forms/${formId}`;
  return {
    isAr,
    shell: { workspace, section: PAGE_SECTIONS.forms.en, arSection: PAGE_SECTIONS.forms.ar, width: "wide" as const },
    view: {
      formId,
      logos,
      swatches: workspace.colors.map((c) => ({ name: c.name, hex: c.hex })),
      studioName: state.session?.name ?? workspace.name,
      answersHref: `${base}/answers`,
      builderHref: `${base}/edit`,
      isAr,
    },
  };
}
