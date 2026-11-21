"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useBrandPage } from "@/contexts/pageGuards";
import { capabilitiesOn } from "@/lib/data/access";
import { isStrategyTab, PAGE_SECTION, strategySectionHref, type StrategyMode, type StrategyTab } from "../constants";

/**
 * The strategy page: the section being edited, edit or read mode, and which
 * sections are blank. The section is the route (/w/<slug>/strategy/<section>),
 * so the address changes with it, the back button walks back through the
 * sections read, and any section can be linked to (review item 4).
 */
export function useStrategyPage(slug: string, section: string) {
  const { uiLang, state } = useApp();
  const page = useBrandPage(slug);
  const router = useRouter();
  const valid = isStrategyTab(section);
  const tab: StrategyTab = valid ? section : "purpose";
  // An unknown section in the address lands on the first one.
  useEffect(() => {
    if (!valid) router.replace(strategySectionHref(slug, "purpose"));
  }, [valid, router, slug]);
  const [requestedMode, setMode] = useState<StrategyMode>("edit");
  const [importOpen, setImportOpen] = useState(false);
  if (!page) return null;
  const { workspace: ws, isAr } = page;
  const { canEdit } = capabilitiesOn(ws, state.session);
  const mode = canEdit ? requestedMode : "read";

  /* Which language of the brand's strategy is being *edited*.
     It follows the interface language, which is what the chrome toggle used to
     do when both were one field — switching the app to Arabic put you in the
     Arabic copy. A second switch here meant two controls on one screen reading
     "EN / ع" and doing different things. */
  const lang = uiLang(ws);

  /**
   * Which sections are still blank, in the language being written. Judged on
   * the copy actually being edited, so switching to Arabic on a brand whose
   * Arabic has not been written yet marks all eight rather than claiming they
   * are done.
   */
  const s = ws.strategy;
  const text = (en: string, ar: string | undefined) => (lang === "ar" ? (ar ?? "") : en).trim();
  const emptyTabs: Record<StrategyTab, boolean> = {
    purpose: !text(s.purpose, s.purposeAr),
    "vision-mission": !text(s.vision, s.visionAr) && !text(s.mission, s.missionAr),
    objectives: s.objectives.length === 0,
    "core-values": s.coreValues.length === 0,
    audience: !text(s.targetAudienceSummary, s.targetAudienceSummaryAr) && s.personas.length === 0,
    competitive: s.competitors.length === 0,
    "positioning-options": s.positioningOptions.length === 0,
    positioning: !text(s.positioningStatement, s.positioningStatementAr),
    uvp: !text(s.uvp, s.uvpAr),
    tone: s.voiceTraits.length === 0,
  };

  return {
    ws,
    isAr,
    lang,
    mode,
    shell: {
      workspace: ws,
      section: PAGE_SECTION.en,
      arSection: PAGE_SECTION.ar,
      // The sections are a list beside the content now (StrategySectionNav),
      // not a row of tabs in the top bar that wrapped onto two lines.
      width: "full" as const,
    },
    actions: {
      ws, isAr, mode, canEdit,
      onMode: (next: StrategyMode) => { if (canEdit) setMode(next); },
      onImport: () => { if (canEdit) setImportOpen(true); },
    },
    importOpen: canEdit && importOpen,
    onCloseImport: () => setImportOpen(false),
    edit: { ws, isAr, lang, tab, slug, emptyTabs },
  };
}

export type StrategyPageState = NonNullable<ReturnType<typeof useStrategyPage>>;
