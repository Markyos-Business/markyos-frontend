"use client";

import { PageContainer } from "@/components/layout";
import { NeedsServer, NewFormView, useStudioNewFormPage } from "@/components/features/discovery";

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
