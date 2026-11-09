"use client";

import { useInterfaceLang } from "@/contexts/useInterfaceLang";
import { PEOPLE_COPY } from "../copy";

/** The person's interface language, and the People copy in it. */
export function usePeopleLang() {
  const { lang } = useInterfaceLang();
  return { lang, isAr: lang === "ar", c: PEOPLE_COPY[lang] } as const;
}
