"use client";

import { createContext, useContext, type ReactNode } from "react";
const Locale = createContext<"en" | "ar">("en");
export function DashboardProvider({ lang, children }: { lang: "en" | "ar"; children: ReactNode }) {
  return <Locale.Provider value={lang}>{children}</Locale.Provider>;
}
export function useDashboardLocale() {
  const lang = useContext(Locale);
  return { lang, isAr: lang === "ar", t: (en: string, ar: string) => lang === "ar" ? ar : en };
}
