"use client";

import { useState } from "react";
import { useDialog, useToast } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { SECTION_ORDER } from "../../constants";
import { createShare, listShares, revokeShare } from "../../services/briefsService";
import type { BriefAnalysis, SectionKey, ShareLinkInfo } from "../../types";

/** What a new link shows unless changed: the read of the brief, not the working notes. */
const DEFAULT_SECTIONS: SectionKey[] = ["snapshot", "goals", "audience", "market", "personality", "routes", "creative"];

export type Expiry = "never" | "7" | "30";

/** The client's link to an analysis: who has one, making a new one, turning one off. */
export function useShareLinks(analysis: BriefAnalysis, isAr: boolean) {
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState(0);
  const links = useRequest(() => (open ? listShares(analysis.id) : Promise.resolve([])), `shares:${analysis.id}:${open}:${version}`);
  const [sections, setSections] = useState<SectionKey[]>(DEFAULT_SECTIONS);
  const [expiry, setExpiry] = useState<Expiry>("30");
  // When the sheet was opened: expiry is judged against it, not the clock at each render.
  const [now] = useState(() => Date.now());
  const live = (links.data ?? []).filter((l) => !l.revokedAt && (!l.expiresAt || Date.parse(l.expiresAt) > now));

  const urlOf = (link: ShareLinkInfo) => `${window.location.origin}/a/${link.token}`;

  async function copy(link: ShareLinkInfo) {
    try {
      await navigator.clipboard.writeText(urlOf(link));
      showToast(t("Link copied.", "نُسخ الرابط."), "success");
    } catch {
      showToast(urlOf(link));
    }
  }

  /** Resolves to `false` to keep the sheet open on the new link, or a message. */
  async function create(): Promise<string | false> {
    if (sections.length === 0) return t("Choose at least one section.", "اختر قسمًا واحدًا على الأقل.");
    const expiresAt = expiry === "never" ? null : new Date(Date.now() + Number(expiry) * 86_400_000).toISOString();
    try {
      const link = await createShare(analysis.id, SECTION_ORDER.filter((k) => sections.includes(k)), expiresAt);
      setVersion((v) => v + 1);
      await copy(link);
      return false;
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
  }

  async function revoke(link: ShareLinkInfo) {
    const ok = await confirm({
      title: t("Turn this link off?", "إيقاف هذا الرابط؟"),
      body: t("Anyone with it sees nothing from now on. Make a new link to share again.", "لن يرى أي شخص لديه الرابط شيئًا بعد الآن. أنشئ رابطًا جديدًا للمشاركة مجددًا."),
      confirmLabel: t("Turn off", "إيقاف"),
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    try {
      await revokeShare(analysis.id, link.id);
      setVersion((v) => v + 1);
      showToast(t("Link turned off.", "أُوقف الرابط."), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err), "danger");
    }
  }

  return {
    open,
    start: () => setOpen(true),
    close: () => setOpen(false),
    links,
    live,
    sections,
    toggle: (key: SectionKey) => setSections((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key])),
    expiry,
    setExpiry,
    create,
    revoke,
    copy,
    urlOf,
  };
}

export type ShareLinksState = ReturnType<typeof useShareLinks>;
