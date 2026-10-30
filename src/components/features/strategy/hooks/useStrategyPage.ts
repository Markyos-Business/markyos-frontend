"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useBrandPage } from "@/contexts/pageGuards";
import type { TopBarTab } from "@/components/layout";
import { PAGE_SECTION, STRATEGY_TABS, type StrategyMode, type StrategyTab } from "../constants";

/** The strategy page: the section being edited, edit or read mode, and which sections are blank. */
export function useStrategyPage(slug: string) {
  const { uiLang } = useApp();
  const page = useBrandPage(slug);
  const [tab, setTab] = useState<StrategyTab>("purpose");
  const [mode, setMode] = useState<StrategyMode>("edit");
  const [importOpen, setImportOpen] = useState(false);
  if (!page) return null;
  const { workspace: ws, isAr } = page;

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

  const tabs: TopBarTab[] = STRATEGY_TABS.map((t) => ({
    key: t.key,
    label: t.label,
    arLabel: t.arLabel,
    active: tab === t.key,
    empty: emptyTabs[t.key],
    onSelect: () => setTab(t.key),
  }));

  return {
    ws,
    isAr,
    lang,
    mode,
    shell: {
      workspace: ws,
      section: PAGE_SECTION.en,
      arSection: PAGE_SECTION.ar,
      // In read mode the document carries its own contents rail, so the
      // section tabs would be a second, competing navigation.
      tabs: mode === "edit" ? tabs : undefined,
      width: "full" as const,
    },
    actions: { ws, isAr, mode, onMode: setMode, onImport: () => setImportOpen(true) },
    importOpen,
    onCloseImport: () => setImportOpen(false),
    edit: { ws, isAr, lang, tab, onTab: setTab, emptyTabs },
  };
}

export type StrategyPageState = NonNullable<ReturnType<typeof useStrategyPage>>;
