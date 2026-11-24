"use client";

import { useRouter } from "next/navigation";
import { Button, DataTable, EmptyState } from "@/components/ui";
import type { DataColumn } from "@/components/ui";
import type { PromoCodeRow } from "@/features/billing";
import type { BillingPage } from "../../hooks/billing/use-billing-page";
import type { PromoActions } from "../../hooks/billing/use-promo-actions";
import { useAdminPromoLang } from "../../hooks/shared/use-admin-lang";
import { discountLabel, shortBatch, usesLabel } from "../../utils/promo";
import { CodeStatusBadge } from "./code-status-badge";
import { codeActions } from "./code-row-actions";
import { day } from "./format";

/** Every code the filters match, 25 at a time. A row opens the code; its actions are in the ⋯. */
export function CodesTable({ page, actions }: { page: BillingPage; actions: PromoActions }) {
  const router = useRouter();
  const { p, lang, isAr } = useAdminPromoLang();
  const t = p.table;
  const open = (row: PromoCodeRow) => router.push(`/admin/billing/codes/${encodeURIComponent(row.id)}`);

  const columns: DataColumn<PromoCodeRow>[] = [
    {
      key: "code",
      header: t.code,
      cell: (row) => (
        <span dir="ltr" className="font-mono font-medium text-text">
          {row.code}
        </span>
      ),
    },
    { key: "discount", header: t.discount, mobileWide: true, cell: (row) => <span dir="auto">{discountLabel(row.discount, lang)}</span> },
    { key: "uses", header: t.uses, cell: (row) => <span className="tabular-nums">{usesLabel(row.uses, lang)}</span> },
    {
      key: "batch",
      header: t.batch,
      cell: (row) => (
        <span dir="ltr" className="font-mono text-caption text-text-muted">
          {shortBatch(row.batchId)}
        </span>
      ),
      className: "hidden lg:table-cell",
    },
    {
      key: "expires",
      header: t.expires,
      cell: (row) => <span className="tabular-nums text-text-muted">{row.expiresAt ? day(row.expiresAt, lang) : t.never}</span>,
      className: "hidden md:table-cell",
    },
    { key: "status", header: t.status, mobileWide: true, cell: (row) => <CodeStatusBadge status={row.status} /> },
  ];

  const empty = page.codesFiltered ? (
    <EmptyState
      icon="search"
      title={p.empty.noMatchTitle}
      description={p.empty.noMatchBody}
      action={
        <Button variant="secondary" size="sm" onClick={page.clearCodeFilters}>
          {p.empty.clear}
        </Button>
      }
    />
  ) : (
    <EmptyState icon="tag" title={p.empty.noneTitle} description={p.empty.noneBody} />
  );

  const data = page.codes.data;
  return (
    <DataTable
      label={t.label}
      itemLabel={t.itemLabel}
      dir={isAr ? "rtl" : "ltr"}
      columns={columns}
      rows={data?.results}
      getRowId={(row) => row.id}
      getRowLabel={(row) => row.code}
      loading={page.codes.loading && !data}
      error={page.codes.error && !data ? page.codes.error : null}
      onRetry={page.codes.reload}
      empty={empty}
      onRowClick={open}
      rowActions={(row) => codeActions(row, p, actions, () => open(row))}
      paging={page.paging(data?.count ?? 0)}
      mobileCard={{ primary: "code", secondary: ["discount", "uses", "status"] }}
      stickyHeader={false}
    />
  );
}
