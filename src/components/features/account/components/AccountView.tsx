"use client";

import { PageHeader, Tabs } from "@/components/ui";
import { StudioHeader } from "@/components/layout";
import { ACCOUNT_TABS } from "../constants";
import { useAccountPage } from "../hooks/useAccountPage";
import { AuditLogSection } from "./AuditLogSection";
import { BillingPanel } from "./BillingPanel";
import { ProfilePanel } from "./ProfilePanel";
import { SsoSection } from "./SsoSection";
import { UsageSection } from "./UsageSection";

/** The account: profile, subscription and the organisation-wide controls. */
export function AccountView() {
  const page = useAccountPage();
  if (!page) return null;
  return (
    <div className="min-h-screen flex flex-col">
      <StudioHeader isAr={false} />

      <div className="flex-1 px-space-6 sm:px-space-10 pb-space-10 flex flex-col gap-5 max-w-190 w-full mx-auto">
        <PageHeader title="Account" description="Your details and sign-in, what this account is paying for, and the organisation-wide controls." />

        <Tabs label="Account" tabs={ACCOUNT_TABS} active={page.tab} onChange={page.onTab} />

        <div key={page.tab} className="flex flex-col gap-5">
          {page.tab === "profile" && <ProfilePanel />}
          {page.tab === "billing" && <BillingPanel workspaces={page.workspaces} />}
          {page.tab === "organisation" && (
            <>
              <UsageSection {...page.usage} />
              <SsoSection {...page.sso} />
              <AuditLogSection {...page.audit} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
