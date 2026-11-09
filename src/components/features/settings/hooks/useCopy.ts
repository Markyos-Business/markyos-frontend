"use client";

import { useToast } from "@/components/ui";

/** Copies text to the clipboard and says so — or says to copy it by hand. */
export function useCopy() {
  const { showToast } = useToast();
  return async (text: string, label: string, isAr = false) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(isAr ? `نُسخ: ${label}.` : `${label} copied.`, "success");
    } catch {
      showToast(isAr ? "تعذّر النسخ، انسخه يدويًا." : "Couldn't copy — copy it manually.", "danger");
    }
  };
}
