"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/features/shell";
import { NeedsServer, ThemeSendView, useFormSendPage } from "@/features/discovery";

export default function FormSendPage() {
  const { slug, formId } = useParams<{ slug: string; formId: string }>();
  const page = useFormSendPage(slug, formId);
  if (!page) return null;
  return (
    <PageShell {...page.shell} offline={<NeedsServer isAr={page.isAr} />}>
      <ThemeSendView {...page.view} />
    </PageShell>
  );
}
