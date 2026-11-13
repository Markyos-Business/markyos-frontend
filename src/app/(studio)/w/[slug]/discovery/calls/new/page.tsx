"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/features/shell";
import { CallNoteEditor, useNewCallNotePage } from "@/features/callnotes";
import { NeedsServer } from "@/features/discovery";

export default function NewCallNotePage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useNewCallNotePage(slug);
  if (!page) return null;
  return (
    <PageShell {...page.shell} offline={<NeedsServer isAr={page.isAr} />}>
      <CallNoteEditor {...page.view} />
    </PageShell>
  );
}
