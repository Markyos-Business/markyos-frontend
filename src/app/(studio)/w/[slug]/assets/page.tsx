"use client";

import { useParams, useRouter } from "next/navigation";
import { useBrandPage } from "@/contexts/pageGuards";
import { PageShell } from "@/features/shell";
import { BrandFilesContent } from "@/features/visual-identity";

export default function AssetsPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const page = useBrandPage(slug);
  if (!page) return null;
  return <PageShell workspace={page.workspace} section="Assets" arSection="الأصول" width="full">
    <BrandFilesContent ws={page.workspace} onManageLogo={() => router.push(`/w/${slug}/visual-identity?tab=logo`)} />
  </PageShell>;
}
