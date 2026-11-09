"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout";
import { MoodboardProjectsView, useMoodboardProjectsPage } from "@/components/features/moodboard";

export default function MoodboardProjectsPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useMoodboardProjectsPage(slug);
  if (!page) return null;
  return (
    <PageShell {...page.shell}>
      <MoodboardProjectsView {...page.view} />
    </PageShell>
  );
}
