"use client";

import { useParams } from "next/navigation";
import { useRedirect } from "@/contexts/pageGuards";

export default function WorkspaceIndexPage() {
  const { slug } = useParams<{ slug: string }>();
  useRedirect(`/w/${slug}/overview`);
  return null;
}
