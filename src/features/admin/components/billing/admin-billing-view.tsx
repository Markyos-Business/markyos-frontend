"use client";

import { PageHeader, TabPanel, Tabs, useTabIds } from "@/components/ui";
import { useBillingActions } from "../../hooks/billing/use-billing-actions";
import { BILLING_TABS, useBillingPage } from "../../hooks/billing/use-billing-page";
import { useAdminBillingLang } from "../../hooks/shared/use-admin-lang";
import { AuditTable } from "./audit-table";
import { CheckoutsFilters } from "./checkouts-filters";
import { CheckoutsTable } from "./checkouts-table";
import { CompDialog } from "./comp-dialog";
import { OrphansTable } from "./orphans-table";
import { SyncDialog } from "./sync-dialog";

const TAB_ICONS = { checkouts: "receipt", orphans: "unlink", audit: "history" } as const;

/**
 * The admin billing tool (billing epic 4.3): every checkout with its status
 * as we hold it, the PayPal subscriptions with nothing behind them, and the
 * log of what admins did and why. The server decides and records; this page
 * asks it and shows the answer.
 */
export function AdminBillingView() {
  const tabIds = useTabIds();
  const { b } = useAdminBillingLang();
  const page = useBillingPage();
  const actions = useBillingActions(() => page.checkouts.reload());

  return (
    <>
      <PageHeader title={b.title} description={b.description} />
      <Tabs
        {...tabIds}
        label={b.tabsLabel}
        active={page.tab}
        onChange={page.setTab}
        tabs={BILLING_TABS.map((key) => ({ key, label: b.tabs[key], icon: TAB_ICONS[key] }))}
      />
      <TabPanel key={page.tab} id={tabIds.panelId} tabsId={tabIds.id} active={page.tab}>
        {page.tab === "checkouts" && (
          <div className="flex flex-col gap-space-5">
            <CheckoutsFilters page={page} />
            <CheckoutsTable page={page} actions={actions} />
          </div>
        )}
        {page.tab === "orphans" && <OrphansTable page={page} />}
        {page.tab === "audit" && <AuditTable page={page} />}
      </TabPanel>
      <SyncDialog actions={actions} />
      <CompDialog actions={actions} />
    </>
  );
}
