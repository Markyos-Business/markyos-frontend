"use client";

import { Button, Icon, PageHeader } from "@/components/ui";
import { StrategyContents, StrategyDocument, StrategyProgress } from "@/features/guideline-site";
import type { Lang, Workspace } from "@/types";
import { WorkingMaterial } from "./working-material";

/** Read mode: the strategy as one document, with its contents and progress beside it. */
export function StrategyReadView({ ws, isAr, lang }: { ws: Workspace; isAr: boolean; lang: Lang }) {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside
        className={`hidden w-[210px] shrink-0 flex-col gap-4 overflow-y-auto px-5 py-6.5 print:hidden lg:flex ${
          isAr ? "shadow-[inset_1px_0_0_var(--hairline)]" : "shadow-[inset_-1px_0_0_var(--hairline)]"
        }`}
      >
        <StrategyContents ws={ws} isAr={isAr} />
        <div className="mt-auto flex flex-col gap-3">
          <StrategyProgress ws={ws} isAr={isAr} />
          <Button variant="secondary" size="xs" block onClick={() => window.print()} icon={<Icon name="file-alt" size={16} />}>
            {isAr ? "طباعة / PDF" : "Print / PDF"}
          </Button>
        </div>
      </aside>

      <div className="min-h-0 flex-1 overflow-auto px-7 py-8">
        <article className="mx-auto flex max-w-[760px] flex-col gap-9">
          <header className="flex flex-col gap-2">
            <PageHeader
              eyebrow={isAr ? "استراتيجية العلامة" : "Brand strategy"}
              title={ws.name}
              description={ws.tagline ? <bdi>{ws.tagline}</bdi> : undefined}
            />
            <div className="mt-2 lg:hidden">
              <StrategyProgress ws={ws} isAr={isAr} />
            </div>
          </header>

          <StrategyDocument ws={ws} isAr={isAr} lang={lang} showMissing />
          <WorkingMaterial ws={ws} lang={lang} />
        </article>
      </div>
    </div>
  );
}
