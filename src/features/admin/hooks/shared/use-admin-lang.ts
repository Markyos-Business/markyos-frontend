"use client";

import { useInterfaceLang } from "@/contexts/useInterfaceLang";
import { ADMIN_BILLING_COPY } from "../../billing-copy";
import { USERS_COPY } from "../../copy";

/** The admin's interface language (their own choice, not a brand's) and the Users copy in it. */
export function useAdminLang() {
  const { lang } = useInterfaceLang();
  return { lang, isAr: lang === "ar", c: USERS_COPY[lang] } as const;
}

/** The same language, with the billing tool's copy. */
export function useAdminBillingLang() {
  const { lang } = useInterfaceLang();
  return { lang, isAr: lang === "ar", b: ADMIN_BILLING_COPY[lang] } as const;
}
