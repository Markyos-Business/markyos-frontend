"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/features/shell";
import { NeedsServer, NewFormView, useBrandNewFormPage } from "@/features/discovery";

export default function BrandNewFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useBrandNewFormPage(slug);
  if (!page) return null;
  return (
    <PageShell {...page.shell} offline={<NeedsServer isAr={page.isAr} />}>
      <NewFormView {...page.view} />
    </PageShell>
  );
}
