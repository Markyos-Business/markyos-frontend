"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/features/shell";
import { OverviewView, SavedLabel, useOverviewPage } from "@/features/overview";

export default function OverviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useOverviewPage(slug);
  if (!page) return null;
  return (
    <PageShell {...page.shell} right={<SavedLabel label={page.savedLabel} />}>
      <OverviewView {...page.view} />
    </PageShell>
  );
}
