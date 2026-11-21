"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/features/shell";
import { DiscoveryView, useDiscoveryPage } from "@/features/callnotes";
import { AnalysisView } from "@/features/briefs";
import { NeedsServer } from "@/features/discovery";

export default function BrandDiscoveryPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useDiscoveryPage(slug);
  if (!page) return null;
  const analysis = page.tab === "analysis";
  return (
    <PageShell {...page.shell} offline={<NeedsServer isAr={page.isAr} feature={analysis ? "analysis" : "discovery"} />}>
      {analysis ? <AnalysisView {...page.analysis} /> : <DiscoveryView {...page.view} />}
    </PageShell>
  );
}
