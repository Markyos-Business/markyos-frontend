"use client";

import { PageContainer, StudioHeader } from "@/components/layout";
import { AccountMenu } from "@/components/features/account";
import { PeopleView, usePeoplePage } from "@/components/features/people";

/** Everyone on the studio's brands, in one place. */
export default function StudioPeoplePage() {
  const page = usePeoplePage();
  if (!page.ready) return null;
  return (
    <div dir={page.isAr ? "rtl" : "ltr"} className="flex h-screen flex-col">
      <StudioHeader isAr={page.isAr} end={<AccountMenu isAr={page.isAr} />} />
      <PageContainer>
        <PeopleView page={page} />
      </PageContainer>
    </div>
  );
}
