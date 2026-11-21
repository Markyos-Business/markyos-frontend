"use client";

import { useInterfaceLang } from "@/contexts/useInterfaceLang";
import { HELP_COPY } from "../copy";

/** The interface language and the Help Center's words in it. */
export function useHelpCopy() {
  const { lang, isAr } = useInterfaceLang();
  return { lang, isAr, h: HELP_COPY[lang] };
}
