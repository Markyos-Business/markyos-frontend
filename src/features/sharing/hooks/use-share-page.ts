"use client";

import { useState } from "react";
import { usePublicPageLocale } from "@/components/ui";
import { useDocumentLang } from "@/contexts/useInterfaceLang";
import type { Lang } from "@/types";
import { useShareLink } from "./use-share-link";

/**
 * A read-only window onto one brand's thinking: the share link a token names,
 * and what it should show. A revoked link is told apart from one that never
 * existed, because those deserve different answers: one means "ask them for
 * a new one", the other means "check the URL".
 */
export function useSharePage(token: string) {
  const { loaded, found } = useShareLink(token);
  // The brand's own language until the reader picks one; the page, the
  // document's lang/dir and the badge all follow that one choice.
  const [chosen, setLang] = useState<Lang | null>(null);
  const lang: Lang = chosen ?? found?.ws.primaryLocale ?? "en";
  const isAr = lang === "ar";
  useDocumentLang(lang, loaded);
  usePublicPageLocale(lang);

  if (!loaded) return null;
  if (!found) return { state: "missing" as const, isAr };
  const { ws, link } = found;
  if (link.revokedAt) return { state: "revoked" as const, isAr };
  const department = link.scope === "department" ? ws.departmentViews.find((d) => d.id === link.departmentId) : undefined;
  // A department link whose department has since been deleted. Saying so is
  // better than rendering an empty page that looks like a bug.
  if (link.scope === "department" && !department) return { state: "gone" as const, isAr };

  return {
    state: "ready" as const,
    isAr,
    ws,
    link,
    department,
    lang,
    setLang,
    title: department ? department.name : isAr ? "استراتيجية العلامة" : "Brand strategy",
    eyebrow: link.scope === "department" ? (isAr ? "دليل قسم" : "Department guide") : isAr ? "الاستراتيجية" : "Strategy",
  };
}

export type SharePageState = NonNullable<ReturnType<typeof useSharePage>>;
export type ReadyShare = Extract<SharePageState, { state: "ready" }>;
