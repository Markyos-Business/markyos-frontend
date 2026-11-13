"use client";

import { PageHeader, TabPanel, Tabs, useTabIds } from "@/components/ui";
import { StudioHeader } from "@/features/shell";
import { ACCOUNT_TABS } from "../constants";
import { useAccountPage } from "../hooks/use-account-page";
import { BillingPanel } from "./billing/billing-panel";
import { AuditLogSection } from "./organisation/audit-log-section";
import { SsoSection } from "./organisation/sso-section";
import { UsageSection } from "./organisation/usage-section";
import { ProfilePanel } from "./profile/profile-panel";
import { useAccountLang } from "../hooks/shared/use-account-lang";

/** The account: profile, subscription and the organisation-wide controls. */
export function AccountView() {
  const tabIds = useTabIds();
  const page = useAccountPage();
  const { t, isAr } = useAccountLang();
  if (!page) return null;
  return (
    <div className="min-h-screen flex flex-col">
      <StudioHeader isAr={isAr} />

      <div className="flex-1 px-space-6 sm:px-space-10 pb-space-10 flex flex-col gap-5 max-w-190 w-full mx-auto">
        <PageHeader
          title={t("Account", "الحساب")}
          description={t("Your details and sign-in, what this account is paying for, and the organisation-wide controls.", "بياناتك وتسجيل دخولك، وما يدفعه هذا الحساب، وإعدادات المؤسسة.")}
        />

        <Tabs {...tabIds} label={t("Account", "الحساب")} tabs={ACCOUNT_TABS.map((tab) => ({ ...tab, label: isAr ? tab.arLabel : tab.label }))} active={page.tab} onChange={page.onTab} />

        <TabPanel key={page.tab} id={tabIds.panelId} tabsId={tabIds.id} active={page.tab} className="flex flex-col gap-5">
          {page.tab === "profile" && <ProfilePanel />}
          {page.tab === "billing" && <BillingPanel workspaces={page.workspaces} />}
          {page.tab === "organisation" && (
            <>
              <UsageSection {...page.usage} />
              <SsoSection {...page.sso} />
              <AuditLogSection {...page.audit} />
            </>
          )}
        </TabPanel>
      </div>
    </div>
  );
}
