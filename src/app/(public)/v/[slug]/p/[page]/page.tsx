"use client";

import { useParams } from "next/navigation";
import { ClientGuideView } from "@/features/guideline-site";

/** A real, addressable URL for one custom guideline page. */
export default function ClientGuidePageViewer() {
  const { slug, page } = useParams<{ slug: string; page: string }>();
  // The page's main landmark; `contents` adds no box around the template.
  return <main className="contents"><ClientGuideView slug={slug} page={page} /></main>;
}
