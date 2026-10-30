"use client";

import { useCurrentAccount } from "@/contexts/AppContext";
import { PEOPLE_COPY } from "../copy";

/** The person's interface language, and the People copy in it. */
export function usePeopleLang() {
  const account = useCurrentAccount();
  const lang = account?.adminLang === "ar" ? "ar" : "en";
  return { lang, isAr: lang === "ar", c: PEOPLE_COPY[lang] } as const;
}
