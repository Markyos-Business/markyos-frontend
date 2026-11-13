"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/features/shell";
import { MoodboardView, useMoodboardPage } from "@/features/moodboard";

export default function MoodboardBoardPage() {
  const { slug, boardId } = useParams<{ slug: string; boardId: string }>();
  const page = useMoodboardPage(slug, boardId);
  if (!page) return null;
  return (
    <PageShell {...page.shell}>
      <MoodboardView {...page.view} />
    </PageShell>
  );
}
