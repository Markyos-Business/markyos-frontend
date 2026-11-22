"use client";

import { useRouter } from "next/navigation";
import { Badge, Button, DataTable, EmptyState, Tag } from "@/components/ui";
import type { DataColumn } from "@/components/ui";
import type { BillingActions } from "../../hooks/billing/use-billing-actions";
import type { BillingPage } from "../../hooks/billing/use-billing-page";
import { useAdminBillingLang } from "../../hooks/shared/use-admin-lang";
import type { AdminCheckout } from "../../types";
import { CheckoutStatusBadge } from "./checkout-status-badge";
import { checkoutActions } from "./checkout-row-actions";
import { day, money } from "./format";

/** Every checkout the filters match, 25 at a time. A row opens the checkout; its actions are in the ⋯. */
export function CheckoutsTable({ page, actions }: { page: BillingPage; actions: BillingActions }) {
  const router = useRouter();
  const { b, lang, isAr } = useAdminBillingLang();
  const t = b.table;
  const open = (row: AdminCheckout) => router.push(`/admin/billing/${encodeURIComponent(row.id)}`);
  const name = (row: AdminCheckout) => row.brand?.name ?? t.deletedBrand;

  const columns: DataColumn<AdminCheckout>[] = [
    {
      key: "brand",
      header: t.brand,
      cell: (row) => (
        <div className="min-w-0">
          <div dir="auto" className="truncate font-medium text-text">
            {name(row)}
          </div>
          {row.brand && (
            <div dir="ltr" className="truncate text-start text-caption text-text-muted">
              {row.brand.slug}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "owner",
      header: t.owner,
      cell: (row) =>
        row.owner ? (
          <div className="min-w-0">
            <div dir="auto" className="truncate text-text">
              {row.owner.name || row.owner.email}
            </div>
            <div dir="ltr" className="truncate text-start text-caption text-text-muted">
              {row.owner.email}
            </div>
          </div>
        ) : (
          <span className="text-text-muted">{t.noOwner}</span>
        ),
      className: "hidden md:table-cell",
    },
    { key: "provider", header: t.provider, cell: (row) => <Tag tone={row.provider === "comp" ? "indigo" : "neutral"}>{b.providers[row.provider] ?? row.provider}</Tag> },
    {
      key: "status",
      header: t.status,
      mobileWide: true,
      cell: (row) => (
        <div className="flex flex-wrap items-center gap-ctl-row">
          <CheckoutStatusBadge status={row.status} refused={row.refused} />
          {row.paymentFailedAt && !row.refused && <Badge tone="warning">{t.paymentFailed}</Badge>}
        </div>
      ),
    },
    {
      key: "amount",
      header: t.amount,
      cell: (row) => <span className="tabular-nums">{row.provider === "comp" ? "—" : money(row.amount, row.currency, lang)}</span>,
      className: "hidden lg:table-cell",
    },
    { key: "periodEnd", header: t.periodEnd, cell: (row) => <span className="tabular-nums text-text-muted">{day(row.currentPeriodEnd, lang)}</span>, className: "hidden lg:table-cell" },
    { key: "created", header: t.created, cell: (row) => <span className="tabular-nums text-text-muted">{day(row.createdAt, lang)}</span>, className: "hidden xl:table-cell" },
  ];

  const empty = page.filtered ? (
    <EmptyState
      icon="search"
      title={b.empty.noMatchTitle(page.values.q)}
      description={b.empty.noMatchBody}
      action={
        <Button variant="secondary" size="sm" onClick={page.clearFilters}>
          {b.empty.clear}
        </Button>
      }
    />
  ) : (
    <EmptyState icon="receipt" title={b.empty.noneTitle} description={b.empty.noneBody} />
  );

  const data = page.checkouts.data;
  return (
    <DataTable
      label={t.label}
      itemLabel={t.itemLabel}
      dir={isAr ? "rtl" : "ltr"}
      columns={columns}
      rows={data?.results}
      getRowId={(row) => row.id}
      getRowLabel={name}
      loading={page.checkouts.loading && !data}
      error={page.checkouts.error && !data ? page.checkouts.error : null}
      onRetry={page.checkouts.reload}
      empty={empty}
      onRowClick={open}
      rowActions={(row) => checkoutActions(row, b, actions, () => open(row))}
      paging={page.paging(data?.count ?? 0)}
      mobileCard={{ primary: "brand", secondary: ["provider", "status"] }}
      stickyHeader={false}
    />
  );
}
