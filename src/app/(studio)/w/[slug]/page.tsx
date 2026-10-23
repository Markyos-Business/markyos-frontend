"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function WorkspaceIndexPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/w/${params.slug}/overview`);
  }, [params.slug, router]);
  return null;
}
