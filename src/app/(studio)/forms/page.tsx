"use client";

import { PageContainer } from "@/features/shell";
import { StudioHeader } from "@/features/shell";
import { AccountMenu } from "@/features/account";
import { FormsListView, NeedsServer, useStudioFormsPage } from "@/features/discovery";

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
