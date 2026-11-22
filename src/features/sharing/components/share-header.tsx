"use client";

import { AssetThumb, LangToggle } from "@/components/ui";
import { initialsFor } from "@/lib/utils";
import { brandMarkUrl } from "@/lib/data/brandSetup";
import type { ReadyShare } from "../hooks/use-share-page";

/** The shared page's top bar: whose brand it is, that it's read-only, and the language. */
export function ShareHeader({ share }: { share: ReadyShare }) {
  const { ws, isAr, lang, setLang } = share;
  const mark = brandMarkUrl(ws);
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 px-6 shadow-[inset_0_-1px_0_var(--hairline)] md:px-10">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2 text-[12px] font-semibold text-text-muted">{mark ? <AssetThumb src={mark} alt="" ground="--surface-2" style={{ height: 20, width: "auto" }} /> : initialsFor(ws.name)}</span>
        <div className="min-w-0">
          <div dir="auto" className="bidi-auto truncate text-[14px] font-semibold">
            {ws.name}
          </div>
          <div className="truncate text-[11px] text-text-faint">{isAr ? "للقراءة فقط" : "Read-only"}</div>
        </div>
      </div>
      <div className="ms-auto flex shrink-0 items-center gap-3">
        <LangToggle value={lang} onChange={setLang} />
      </div>
    </header>
  );
}
