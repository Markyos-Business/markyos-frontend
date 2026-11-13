"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useBrandPage } from "@/contexts/pageGuards";
import { useDialog, useToast } from "@/components/ui";
import type { Draft } from "@/types";
import { AR_FIELD_LABEL, FIELD_LABEL, PAGE_SECTION } from "../constants";

export type DraftsTab = "pending" | "decided";

export function targetLabel(d: Draft, isAr = false) {
  if (d.targetType === "strategyField") return (isAr ? AR_FIELD_LABEL : FIELD_LABEL)[d.targetRef] ?? d.targetRef;
  return d.targetRef;
}

/**
 * One queue for everything proposed into this brand.
 *
 * Discovery forms, document import and palette extraction all write here rather than
 * into the brand, and this is where a person decides. Keeping it in one place
 * is the point: a reviewer should not have to visit eight tabs to find out what
 * is waiting, and a producer should not get to choose whether it is reviewed.
 */
export function useDraftsPage(slug: string) {
  const { acceptDraft, rejectDraft } = useApp();
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const page = useBrandPage(slug);
  const ws = page?.workspace;
  const [tab, setTab] = useState<DraftsTab>("pending");

  const { pending, decided } = useMemo(() => {
    const all = ws?.drafts ?? [];
    return {
      pending: all.filter((d) => d.status === "pending"),
      decided: all.filter((d) => d.status !== "pending"),
    };
  }, [ws?.drafts]);

  if (!page || !ws) return null;

  /**
   * Accepting overwrites whatever is in the field today, so when there is
   * something to lose the person is shown it first. A confirm on an empty
   * field would be ceremony; a silent overwrite of a written positioning
   * statement would be a loss.
   */
  async function accept(d: Draft) {
    const current =
      d.targetType === "strategyField"
        ? ((ws!.strategy as unknown as Record<string, string | undefined>)[d.targetRef] ?? "")
        : "";

    if (current.trim()) {
      const ok = await confirm({
        title: page!.isAr ? `استبدال ${targetLabel(d, true)}؟` : `Replace ${targetLabel(d)}?`,
        body: page!.isAr
          ? `يوجد نص مكتوب هنا بالفعل، والقبول يستبدله.\n\nالحالي:\n${current.slice(0, 220)}`
          : `There is already something written here. Accepting replaces it.\n\nCurrent:\n${current.slice(0, 220)}`,
        confirmLabel: page!.isAr ? "استبدله" : "Replace it",
        tone: "danger",
        isAr: page!.isAr,
      });
      if (!ok) return;
    }
    acceptDraft(ws!.id, d.id);
    showToast(page!.isAr ? `قُبلت في ${targetLabel(d, true)}.` : `Accepted into ${targetLabel(d)}.`, "success");
  }

  function reject(d: Draft) {
    rejectDraft(ws!.id, d.id);
    showToast(page!.isAr ? "رُفضت، وحُفظت مع مبرراتها." : "Rejected — kept with its reasoning.");
  }

  return {
    shell: { workspace: ws, section: PAGE_SECTION.en, arSection: PAGE_SECTION.ar, width: "full" as const },
    view: {
      isAr: page.isAr,
      tab,
      onTab: setTab,
      pending,
      decided,
      shown: tab === "pending" ? pending : decided,
      onAccept: accept,
      onReject: reject,
    },
  };
}
