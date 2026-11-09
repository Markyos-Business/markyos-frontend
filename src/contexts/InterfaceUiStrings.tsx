"use client";

import type { ReactNode } from "react";
import { UiStringsProvider } from "@/components/ui";
import { useInterfaceLang } from "./useInterfaceLang";

/**
 * The kit's own words ("Retry", "Rows per page", "Cancel") in the person's
 * interface language, app-wide. A brand's pages and the admin area narrow it
 * to their own language further down.
 */
export function InterfaceUiStrings({ children }: { children: ReactNode }) {
  const { lang } = useInterfaceLang();
  return <UiStringsProvider lang={lang}>{children}</UiStringsProvider>;
}
