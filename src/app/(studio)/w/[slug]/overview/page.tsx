"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout";
import { OverviewView, SavedLabel, useOverviewPage } from "@/components/features/overview";

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
