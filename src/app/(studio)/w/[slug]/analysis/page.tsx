"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/features/shell";
import { AnalysisView, useAnalysisPage } from "@/features/briefs";
import { NeedsServer } from "@/features/discovery";

export default function BrandAnalysisPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useAnalysisPage(slug);
  if (!page) return null;
  return (
    <PageShell {...page.shell} offline={<NeedsServer isAr={page.isAr} feature="analysis" />}>
      <AnalysisView {...page.view} />
    </PageShell>
  );
}
