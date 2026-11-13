"use client";

import { useInterfaceLang } from "@/contexts/useInterfaceLang";

/** The account pages' language (the person's own) and a `t(en, ar)` to pick a string. */
export function useAccountLang() {
  const { lang, isAr } = useInterfaceLang();
  const t = (en: string, ar: string) => (isAr ? ar : en);
  return { lang, isAr, t } as const;
}
