"use client";

import { useDialog, useToast } from "@/components/ui";
import { useContentLang } from "./use-content-lang";

/** Confirms, runs a removal, reports it, and reloads the list it came from. */
export function useRemove() {
  const { c } = useContentLang();
  const { confirm } = useDialog();
  const { showToast } = useToast();
  return async (run: () => Promise<unknown>, reload: () => void, title: string = c.common.confirmRemove) => {
    const ok = await confirm({ title, confirmLabel: c.common.remove, tone: "danger" });
    if (!ok) return;
    try {
      await run();
      showToast(c.common.removed, "success");
      reload();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : String(e), "danger");
    }
  };
}
