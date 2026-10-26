"use client";

import { Icon } from "@/components/ui";
import { DepartmentDocument, StrategyDocument, strategyIsEmpty } from "@/components/features/guideline-site";
import type { ReadyShare } from "../hooks/useSharePage";

/**
 * The shared document itself: the same components the studio proofreads
 * with, so what the reader gets is exactly what the studio saw.
 */
export function ShareBody({ share }: { share: ReadyShare }) {
  const { ws, link, department, isAr, lang, title, eyebrow } = share;
  return (
    <main className="mx-auto flex w-full max-w-[820px] flex-1 flex-col gap-7 px-6 py-10 md:px-8">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[.1em] text-text-faint">{eyebrow}</span>
        <h1 dir="auto" className="bidi-auto font-display text-[32px] font-semibold tracking-tight">
          {title}
        </h1>
      </div>

      {department ? (
        <DepartmentDocument ws={ws} view={department} isAr={isAr} surface="app" idPrefix={`share-${link.id}-`} />
      ) : strategyIsEmpty(ws) ? (
        <p className="text-[14px] text-text-muted">{isAr ? "لم تُكتب الاستراتيجية بعد." : "The strategy hasn't been written yet."}</p>
      ) : (
        <StrategyDocument ws={ws} isAr={isAr} lang={lang} surface="app" idPrefix={`share-${link.id}-`} />
      )}

      <div className="flex items-center gap-2 pt-4 text-[11.5px] text-text-faint shadow-[inset_0_1px_0_var(--hairline)]">
        <Icon name="eye" size={12} className="mt-[10px]" />
        <span className="mt-[10px]">
          {isAr
            ? "رابط للقراءة فقط. يعرض أحدث نسخة، ويمكن للاستوديو إيقافه في أي وقت."
            : "A read-only link. It shows the current version, and the studio can switch it off at any time."}
        </span>
      </div>
    </main>
  );
}
