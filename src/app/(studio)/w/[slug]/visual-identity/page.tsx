"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/features/shell";
import { VisualIdentityView, useVisualIdentityPage } from "@/features/visual-identity";

export default function VisualIdentityPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useVisualIdentityPage(slug);
  if (!page) return null;
  return (
    <PageShell {...page.shell}>
      <VisualIdentityView {...page.view} />
    </PageShell>
  );
}
