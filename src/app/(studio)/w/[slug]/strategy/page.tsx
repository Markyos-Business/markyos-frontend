"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout";
import { ImportStrategyModal, StrategyActions, StrategyEditView, StrategyReadView, useStrategyPage } from "@/components/features/strategy";

export default function StrategyPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useStrategyPage(slug);
  if (!page) return null;
  return (
    <PageShell {...page.shell} right={<StrategyActions {...page.actions} />}>
      {page.importOpen && <ImportStrategyModal ws={page.ws} onClose={page.onCloseImport} />}
      {page.mode === "read" ? <StrategyReadView ws={page.ws} isAr={page.isAr} lang={page.lang} /> : <StrategyEditView {...page.edit} />}
    </PageShell>
  );
}
