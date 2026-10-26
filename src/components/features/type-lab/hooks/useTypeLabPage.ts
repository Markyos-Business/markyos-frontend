"use client";

import { useState } from "react";
import { useBrandPage } from "@/contexts/pageGuards";
import { brandFontStacks } from "@/components/features/guideline-site";
import { PAGE_SECTION } from "../constants";

/** The type sandbox: a Latin and an Arabic specimen, each with its own size, leading and weight. */
export function useTypeLabPage(slug: string) {
  const page = useBrandPage(slug);
  const [latinText, setLatinText] = useState("Brand governance for studios that ship in two directions.");
  const [latinSize, setLatinSize] = useState(40);
  const [latinLeading, setLatinLeading] = useState(1.2);
  const [latinTracking, setLatinTracking] = useState(-0.02);
  const [latinWeight, setLatinWeight] = useState<number>(600);

  const [arabicText, setArabicText] = useState("إدارة الهوية البصرية للاستوديوهات التي تعمل باتجاهين.");
  const [arabicSize, setArabicSize] = useState(36);
  const [arabicLeading, setArabicLeading] = useState(1.5);
  const [arabicWeight, setArabicWeight] = useState<number>(500);

  if (!page) return null;
  const ws = page.workspace;
  // The sandbox has to render the face the brand actually ships, or the
  // numbers a designer settles on here don't transfer to anything.
  const fonts = brandFontStacks(ws);

  return {
    shell: { workspace: ws, section: PAGE_SECTION.en, arSection: PAGE_SECTION.ar, width: "full" as const },
    view: {
      isAr: page.isAr,
      fontCss: fonts.css,
      anyUploaded: fonts.latinIsUploaded || fonts.arabicIsUploaded,
      latin: {
        dir: "ltr" as const,
        label: "Latin",
        familyLabel: ws.typography.latinFamily,
        live: fonts.latinIsUploaded,
        fontVar: fonts.latin,
        text: latinText,
        onText: setLatinText,
        size: latinSize,
        onSize: setLatinSize,
        leading: latinLeading,
        onLeading: setLatinLeading,
        tracking: latinTracking,
        onTracking: setLatinTracking,
        weight: latinWeight,
        onWeight: setLatinWeight,
      },
      arabic: {
        dir: "rtl" as const,
        label: "Arabic",
        familyLabel: ws.typography.arabicFamily,
        live: fonts.arabicIsUploaded,
        fontVar: fonts.arabic,
        text: arabicText,
        onText: setArabicText,
        size: arabicSize,
        onSize: setArabicSize,
        leading: arabicLeading,
        onLeading: setArabicLeading,
        weight: arabicWeight,
        onWeight: setArabicWeight,
      },
    },
  };
}

export type TypeLabView = NonNullable<ReturnType<typeof useTypeLabPage>>["view"];
export type LangPanelState = TypeLabView["latin"] | TypeLabView["arabic"];
