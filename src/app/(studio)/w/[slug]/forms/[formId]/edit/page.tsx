"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout";
import { BuilderView, NeedsServer, useFormBuilderPage } from "@/components/features/discovery";

export default function FormBuilderPage() {
  const { slug, formId } = useParams<{ slug: string; formId: string }>();
  const page = useFormBuilderPage(slug, formId);
  if (!page) return null;
  return (
    <PageShell {...page.shell} offline={<NeedsServer isAr={page.isAr} />}>
      <BuilderView {...page.view} />
    </PageShell>
  );
}
