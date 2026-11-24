"use client";

import { Button, Icon, PageHeader, TabPanel, Tabs, useTabIds } from "@/components/ui";
import { useBillingActions } from "../../hooks/billing/use-billing-actions";
import { usePromoActions } from "../../hooks/billing/use-promo-actions";
import { BILLING_TABS, useBillingPage } from "../../hooks/billing/use-billing-page";
import { useAdminBillingLang, useAdminPromoLang } from "../../hooks/shared/use-admin-lang";
import { AuditTable } from "./audit-table";
import { CheckoutsFilters } from "./checkouts-filters";
import { CheckoutsTable } from "./checkouts-table";
import { CodesFilters } from "./codes-filters";
import { CodesTable } from "./codes-table";
import { CompDialog } from "./comp-dialog";
import { GenerateCodesDialog } from "./generate-codes-dialog";
import { GeneratedCodesModal } from "./generated-codes-modal";
import { OrphansTable } from "./orphans-table";
import { SyncDialog } from "./sync-dialog";

const TAB_ICONS = { checkouts: "receipt", codes: "tag", orphans: "unlink", audit: "history" } as const;

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
  const promo = usePromoActions(() => page.codes.reload());
  const { p } = useAdminPromoLang();

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
        {page.tab === "codes" && (
          <div className="flex flex-col gap-space-5">
            <div className="flex flex-wrap items-center justify-between gap-space-3">
              <p className="min-w-0 max-w-prose flex-1 text-body text-text-muted">{p.intro}</p>
              <Button variant="primary" icon={<Icon name="plus" size={18} />} onClick={() => promo.setGenerating(true)}>
                {p.generate}
              </Button>
            </div>
            <CodesFilters page={page} />
            <CodesTable page={page} actions={promo} />
          </div>
        )}
        {page.tab === "orphans" && <OrphansTable page={page} />}
        {page.tab === "audit" && <AuditTable page={page} />}
      </TabPanel>
      <SyncDialog actions={actions} />
      <CompDialog actions={actions} />
      <GenerateCodesDialog actions={promo} />
      <GeneratedCodesModal actions={promo} onShowBatch={(batch) => page.filters.setMany({ batch, codeStatus: "" })} />
    </>
  );
}
