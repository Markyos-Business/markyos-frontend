"use client";

import { PageContainer } from "@/features/shell";
import { StudioHeader } from "@/features/shell";
import { AccountMenu } from "@/features/account";
import { PeopleView, usePeoplePage } from "@/features/people";

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
