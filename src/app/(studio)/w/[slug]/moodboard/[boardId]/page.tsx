"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout";
import { MoodboardView, useMoodboardPage } from "@/components/features/moodboard";

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
