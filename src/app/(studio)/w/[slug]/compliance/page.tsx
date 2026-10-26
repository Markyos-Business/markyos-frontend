"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout";
import { AssetColorContent, CopyLinterContent, useCompliancePage } from "@/components/features/compliance";

export default function CompliancePage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useCompliancePage(slug);
  if (!page) return null;
  return <PageShell {...page.shell}>{page.tab === "colors" ? <AssetColorContent ws={page.ws} /> : <CopyLinterContent ws={page.ws} />}</PageShell>;
}
