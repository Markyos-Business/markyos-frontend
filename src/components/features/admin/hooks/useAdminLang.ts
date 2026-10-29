"use client";

import { useCurrentAccount } from "@/contexts/AppContext";
import { USERS_COPY } from "../copy";

/** The admin's interface language (their own choice, not a brand's) and the Users copy in it. */
export function useAdminLang() {
  const account = useCurrentAccount();
  const lang = account?.adminLang === "ar" ? "ar" : "en";
  return { lang, isAr: lang === "ar", c: USERS_COPY[lang] } as const;
}
