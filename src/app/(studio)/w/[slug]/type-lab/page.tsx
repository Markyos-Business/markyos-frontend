"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/features/shell";
import { TypeLabView, useTypeLabPage } from "@/features/type-lab";

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
