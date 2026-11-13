"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/features/shell";
import { SettingsView, useSettingsPage } from "@/features/settings";

export default function SettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useSettingsPage(slug);
  if (!page) return null;
  return (
    <PageShell {...page.shell}>
      <SettingsView {...page.view} />
    </PageShell>
  );
}
