"use client";

import { useParams } from "next/navigation";
import { ClientGuideView } from "@/components/features/guideline-site";

export default function ClientViewerPage() {
  const { slug } = useParams<{ slug: string }>();
  return <ClientGuideView slug={slug} />;
}
