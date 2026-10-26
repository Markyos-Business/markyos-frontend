"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout";
import { CallNoteDetail, useCallNotePage } from "@/components/features/callnotes";
import { NeedsServer } from "@/components/features/discovery";

export default function CallNotePage() {
  const { slug, noteId } = useParams<{ slug: string; noteId: string }>();
  const page = useCallNotePage(slug, noteId);
  if (!page) return null;
  return (
    <PageShell {...page.shell} offline={<NeedsServer isAr={page.isAr} />}>
      <CallNoteDetail {...page.view} />
    </PageShell>
  );
}
