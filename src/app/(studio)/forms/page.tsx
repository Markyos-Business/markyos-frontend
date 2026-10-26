"use client";

import { PageContainer, StudioHeader } from "@/components/layout";
import { AccountMenu } from "@/components/features/account";
import { FormsListView, NeedsServer, useStudioFormsPage } from "@/components/features/discovery";

/** Every discovery form across the studio's brands. */
export default function StudioFormsPage() {
  const page = useStudioFormsPage();
  if (!page) return null;
  return (
    <div dir={page.isAr ? "rtl" : "ltr"} className="flex h-screen flex-col">
      <StudioHeader isAr={page.isAr} end={<AccountMenu isAr={page.isAr} />} />
      <PageContainer offline={<NeedsServer isAr={page.isAr} />}>
        <FormsListView {...page.view} />
      </PageContainer>
    </div>
  );
}
