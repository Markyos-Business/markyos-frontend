"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout";
import { AnalysisView, useAnalysisPage } from "@/components/features/briefs";
import { NeedsServer } from "@/components/features/discovery";

export default function BrandAnalysisPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useAnalysisPage(slug);
  if (!page) return null;
  return (
    <PageShell {...page.shell} offline={<NeedsServer isAr={page.isAr} />}>
      <AnalysisView {...page.view} />
    </PageShell>
  );
}
