"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout";
import { TypeLabView, useTypeLabPage } from "@/components/features/type-lab";

export default function TypeLabPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useTypeLabPage(slug);
  if (!page) return null;
  return (
    <PageShell {...page.shell}>
      <TypeLabView {...page.view} />
    </PageShell>
  );
}
