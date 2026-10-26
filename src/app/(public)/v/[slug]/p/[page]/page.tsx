"use client";

import { useParams } from "next/navigation";
import { ClientGuideView } from "@/components/features/guideline-site";

/** A real, addressable URL for one custom guideline page. */
export default function ClientGuidePageViewer() {
  const { slug, page } = useParams<{ slug: string; page: string }>();
  return <ClientGuideView slug={slug} page={page} />;
}
