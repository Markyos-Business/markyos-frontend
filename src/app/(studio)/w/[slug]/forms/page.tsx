"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/features/shell";
import { FormsListView, NeedsServer, useBrandFormsPage } from "@/features/discovery";

export default function BrandFormsPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useBrandFormsPage(slug);
  if (!page) return null;
  return (
    <PageShell {...page.shell} offline={<NeedsServer isAr={page.isAr} />}>
      <FormsListView {...page.view} />
    </PageShell>
  );
}
