"use client";

import { useEffect, useState } from "react";
import { formatAgo } from "../utils/format";

type SaveStatusProps = { saving: boolean; savedAt: number | null; error: string | null; isAr: boolean };

/** "Saving…", "Saved 1m", or that the last change didn't save. */
export function SaveStatus({ saving, savedAt, error, isAr }: SaveStatusProps) {
  // Re-render each minute so "Saved 1m" keeps counting.
  const [, tick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => window.clearInterval(t);
  }, []);
  const text = error
    ? isAr
      ? "لم يُحفظ آخر تعديل"
      : "Last change didn't save"
    : saving
      ? isAr
        ? "جارٍ الحفظ…"
        : "Saving…"
      : savedAt
        ? `${isAr ? "حُفظ" : "Saved"} ${formatAgo(new Date(savedAt).toISOString(), isAr)}`
        : isAr
          ? "كل شيء محفوظ"
          : "All saved";
  return (
    <span role="status" aria-live="polite" className={`text-caption font-medium ${error ? "text-danger" : "text-text-muted"}`}>
      {text}
    </span>
  );
}
