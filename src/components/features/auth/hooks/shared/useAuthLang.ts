"use client";

import { useInterfaceLang } from "@/contexts/useInterfaceLang";
import { AUTH_COPY } from "../../copy";

/** The signed-out screens' language (Arabic unless chosen otherwise) and their copy in it. */
export function useAuthLang() {
  const { lang, isAr, setLang, settled } = useInterfaceLang();
  return { lang, isAr, setLang, settled, c: AUTH_COPY[lang] } as const;
}
