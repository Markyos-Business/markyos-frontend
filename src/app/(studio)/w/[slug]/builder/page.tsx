"use client";

import { useParams } from "next/navigation";
import { BuilderView, useBuilderPage } from "@/components/features/builder";

// No top bar: the editor takes the window and carries its own way back out.
export default function BuilderPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useBuilderPage(slug);
  if (!page) return null;
  return <BuilderView {...page} />;
}
