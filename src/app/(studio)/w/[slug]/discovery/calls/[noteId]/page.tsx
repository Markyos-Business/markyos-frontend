"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/features/shell";
import { CallNoteDetail, useCallNotePage } from "@/features/callnotes";
import { NeedsServer } from "@/features/discovery";

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
