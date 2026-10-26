"use client";

import { TemplatesHeader, TemplatesView, useTemplatesPage } from "@/components/features/templates";

export default function TemplatesPage() {
  const page = useTemplatesPage();
  if (!page) return null;
  return (
    <div className="min-h-screen flex flex-col">
      <TemplatesHeader />
      <TemplatesView {...page} />
    </div>
  );
}
