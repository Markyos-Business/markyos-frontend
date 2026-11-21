"use client";

import { StatusDot } from "@/components/ui";
import { useHelpCopy } from "../../hooks/use-help-copy";
import type { HelpLocale, HelpStatus } from "../../types";

const TONE: Record<HelpStatus, "neutral" | "warning" | "info" | "success" | "danger"> = {
  draft: "neutral",
  in_review: "warning",
  scheduled: "info",
  published: "success",
  archived: "neutral",
};

/** Each language's own status: publishing one never publishes the other. */
export function StatusDots({ status }: { status: Record<HelpLocale, HelpStatus | null> }) {
  const { h } = useHelpCopy();
  const a = h.articles;
  return (
    <span className="flex flex-wrap items-center gap-x-space-5 gap-y-space-2">
      {(["en", "ar"] as const).map((locale) => {
        const s = status[locale];
        return <StatusDot key={locale} tone={s ? TONE[s] : "neutral"} label={h.editor.statusIn(a.language[locale], s ? a.status[s] : a.status.none)} />;
      })}
    </span>
  );
}
