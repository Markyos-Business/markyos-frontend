"use client";

import { useRouter } from "next/navigation";
import { Badge, DataTable, EmptyState, Icon } from "@/components/ui";
import type { DataColumn } from "@/components/ui";
import type { BillingPage } from "../../hooks/billing/use-billing-page";
import { useAdminBillingLang } from "../../hooks/shared/use-admin-lang";
import type { AdminOrphan } from "../../types";
import { CheckoutStatusBadge } from "./checkout-status-badge";
import { day } from "./format";

/**
 * PayPal subscriptions with no live checkout behind them (the server's
 * safety net). Read-only: the server cancels them. One that took money is
 * highlighted, since someone may need a refund.
 */
export function OrphansTable({ page }: { page: BillingPage }) {
  const router = useRouter();
  const { b, lang, isAr } = useAdminBillingLang();
  const o = b.orphans;
  const columns: DataColumn<AdminOrphan>[] = [
    {
      key: "subscription",
      header: o.subscription,
      cell: (row) => (
        <span dir="ltr" className="font-medium text-text">
          {row.subscriptionId}
        </span>
      ),
    },
    { key: "paypalStatus", header: o.paypalStatus, cell: (row) => <CheckoutStatusBadge status={row.paypalStatus} /> },
    {
      key: "money",
      header: o.money,
      cell: (row) =>
        row.moneyTaken ? (
          <Badge tone="danger" icon={<Icon name="exclamation-circle" size={16} />}>
            {o.moneyTaken}
          </Badge>
        ) : (
          <span className="text-text-muted">{o.noMoney}</span>
        ),
    },
    { key: "brand", header: o.brand, cell: (row) => <span dir="ltr" className="text-text-muted">{row.workspaceId ?? "—"}</span>, className: "hidden 2xl:table-cell" },
    { key: "firstSeen", header: o.firstSeen, cell: (row) => <span className="tabular-nums text-text-muted">{day(row.firstSeenAt, lang)}</span>, className: "hidden lg:table-cell" },
    { key: "alerted", header: o.alerted, cell: (row) => <span className="tabular-nums text-text-muted">{row.alertedAt ? day(row.alertedAt, lang) : o.notYet}</span>, className: "hidden xl:table-cell" },
    { key: "cancelled", header: o.cancelled, cell: (row) => <span className="tabular-nums text-text-muted">{row.cancelledAt ? day(row.cancelledAt, lang) : o.notYet}</span> },
  ];

  return (
    <div className="flex flex-col gap-space-5">
      <p className="text-body text-text-muted">{o.intro}</p>
      <DataTable
        label={o.label}
        itemLabel={o.itemLabel}
        dir={isAr ? "rtl" : "ltr"}
        columns={columns}
        rows={page.orphans.data ?? undefined}
        getRowId={(row) => row.subscriptionId}
        getRowLabel={(row) => row.subscriptionId}
        getRowState={(row) => (row.moneyTaken ? "highlighted" : "idle")}
        loading={page.orphans.loading && !page.orphans.data}
        error={page.orphans.error && !page.orphans.data ? page.orphans.error : null}
        onRetry={page.orphans.reload}
        // A row with a checkout behind it opens that checkout; the others have no page.
        onRowClick={(row) => {
          if (row.checkout) router.push(`/admin/billing/${encodeURIComponent(row.checkout)}`);
        }}
        empty={<EmptyState icon="check-circle" title={o.emptyTitle} description={o.emptyBody} />}
        mobileCard={{ primary: "subscription", secondary: ["paypalStatus", "money", "cancelled"] }}
        stickyHeader={false}
      />
    </div>
  );
}
