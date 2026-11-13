"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/features/shell";
import { Skeleton } from "@/components/ui";
import { CallNoteEditor, useEditCallNotePage } from "@/features/callnotes";
import { NeedsServer } from "@/features/discovery";

export default function EditCallNotePage() {
  const { slug, noteId } = useParams<{ slug: string; noteId: string }>();
  const page = useEditCallNotePage(slug, noteId);
  if (!page) return null;
  return (
    <PageShell {...page.shell} offline={<NeedsServer isAr={page.isAr} />}>
      {page.view ? <CallNoteEditor key={page.view.note.id} {...page.view} /> : <Skeleton className="h-96 w-full rounded-card" />}
    </PageShell>
  );
}
