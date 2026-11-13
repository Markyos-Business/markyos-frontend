"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/features/shell";
import { AnalysisLink } from "@/features/briefs";
import { RelatedCalls } from "@/features/callnotes";
import { AnswersView, NeedsServer, useFormAnswersPage } from "@/features/discovery";

export default function FormAnswersPage() {
  const { slug, formId } = useParams<{ slug: string; formId: string }>();
  const page = useFormAnswersPage(slug, formId);
  if (!page) return null;
  return (
    <PageShell {...page.shell} offline={<NeedsServer isAr={page.isAr} />}>
      <AnswersView {...page.view} analysis={<AnalysisLink {...page.analysis} />} aside={<RelatedCalls {...page.relatedCalls} />} />
    </PageShell>
  );
}
