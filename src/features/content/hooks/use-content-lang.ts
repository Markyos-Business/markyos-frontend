"use client";

import { useInterfaceLang } from "@/contexts/useInterfaceLang";
import { CONTENT_COPY } from "../copy";

/** The person's interface language and this area's words in it. */
export function useContentLang() {
  const { lang, isAr, settled } = useInterfaceLang();
  return { lang, isAr, settled, c: CONTENT_COPY[lang] };
}
