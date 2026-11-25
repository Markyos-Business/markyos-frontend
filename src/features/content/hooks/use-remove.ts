"use client";

import { useDialog, useToast } from "@/components/ui";
import { useContentLang } from "./use-content-lang";
import { errorText } from "@/lib/api/errorText";

/** Confirms, runs a removal, reports it, and reloads the list it came from. */
export function useRemove() {
  const { c, lang } = useContentLang();
  const { confirm } = useDialog();
  const { showToast } = useToast();
  return async (
    run: () => Promise<unknown>,
    reload: () => void,
    title: string = c.common.confirmRemove,
    // Words for a delete rather than a removal: the body under the title, the button and the toast.
    words: { body?: string; confirmLabel?: string; done?: string } = {},
  ) => {
    const ok = await confirm({ title, body: words.body, confirmLabel: words.confirmLabel ?? c.common.remove, tone: "danger" });
    if (!ok) return;
    try {
      await run();
      showToast(words.done ?? c.common.removed, "success");
      reload();
    } catch (e: unknown) {
      showToast(errorText(e, lang), "danger");
    }
  };
}
