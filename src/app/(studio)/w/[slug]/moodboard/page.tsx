"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout";
import { MoodboardView, useMoodboardPage } from "@/components/features/moodboard";

export default function MoodboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useMoodboardPage(slug);
  if (!page) return null;
  return (
    <PageShell {...page.shell}>
      <MoodboardView {...page.view} />
    </PageShell>
  );
}
