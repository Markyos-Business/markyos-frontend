"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/features/shell";
import { TeamView, useTeamPage } from "@/features/team";

export default function TeamPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useTeamPage(slug);
  if (!page) return null;
  return (
    <PageShell {...page.shell}>
      <TeamView {...page.view} />
    </PageShell>
  );
}
