"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/features/shell";
import { OverviewView, useOverviewPage } from "@/features/overview";

export default function OverviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useOverviewPage(slug);
  if (!page) return null;
  return (
    <PageShell {...page.shell}>
      <OverviewView {...page.view} />
    </PageShell>
  );
}
