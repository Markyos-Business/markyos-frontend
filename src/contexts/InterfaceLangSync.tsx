"use client";

import { useAdoptGuestLang } from "@/contexts/useInterfaceLang";

/** Carries the language chosen before sign-in onto an account that has none yet. */
export function InterfaceLangSync() {
  useAdoptGuestLang();
  return null;
}
