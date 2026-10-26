"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout";
import { DiscoveryView, useDiscoveryPage } from "@/components/features/callnotes";
import { NeedsServer } from "@/components/features/discovery";

export default function BrandDiscoveryPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useDiscoveryPage(slug);
  if (!page) return null;
  return (
    <PageShell {...page.shell} offline={<NeedsServer isAr={page.isAr} />}>
      <DiscoveryView {...page.view} />
    </PageShell>
  );
}
