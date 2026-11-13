"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/features/shell";
import { DraftsView, useDraftsPage } from "@/features/drafts";

export default function DraftsPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useDraftsPage(slug);
  if (!page) return null;
  return (
    <PageShell {...page.shell}>
      <DraftsView {...page.view} />
    </PageShell>
  );
}
