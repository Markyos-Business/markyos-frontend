"use client";

import { PageContainer } from "@/features/shell";
import { NeedsServer, NewFormView, useStudioNewFormPage } from "@/features/discovery";

export default function StudioNewFormPage() {
  const page = useStudioNewFormPage();
  if (!page) return null;
  return (
    <div dir={page.isAr ? "rtl" : "ltr"} className="flex h-screen flex-col pt-space-10">
      <PageContainer offline={<NeedsServer isAr={page.isAr} />}>
        <NewFormView {...page.view} />
      </PageContainer>
    </div>
  );
}
