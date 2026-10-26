"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Icon, useToast } from "@/components/ui";
import type { Workspace } from "@/types";

/**
 * The brand's name, editable in place.
 *
 * It was set once at creation and never again, which made a typo permanent.
 * Renaming leaves the slug alone on purpose — that's the client-facing URL and
 * may already be in a proposal — so the hint says what does and doesn't change
 * rather than letting someone discover it by breaking a shared link.
 */
export function BrandNameField({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const { renameWorkspace } = useApp();
  const { showToast } = useToast();
  const [draft, setDraft] = useState<string | null>(null);

  function commit() {
    if (draft !== null && draft.trim() && draft.trim() !== ws.name) {
      renameWorkspace(ws.id, draft);
      showToast(isAr ? "تمت إعادة التسمية." : `Renamed to ${draft.trim()}. The client link is unchanged.`, "success");
    }
    setDraft(null);
  }

  if (draft !== null) {
    return (
      <input
        autoFocus
        dir="auto"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setDraft(null);
        }}
        aria-label={isAr ? "اسم العلامة" : "Brand name"}
        className="bidi-auto h-8 min-w-0 flex-1 rounded-md bg-surface-2 px-2 text-[14px] font-semibold text-text shadow-[inset_0_0_0_1px_rgba(0,153,255,.5)] outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setDraft(ws.name)}
      title={isAr ? "إعادة تسمية العلامة" : "Rename this brand — the client link stays the same"}
      className="mk-tap min-w-0 cursor-pointer gap-2 text-start"
    >
      <span dir="auto" className="bidi-auto truncate text-[14px] font-semibold">
        {ws.name}
      </span>
      <Icon name="pen" size={11} className="shrink-0 text-text-faint" />
    </button>
  );
}
