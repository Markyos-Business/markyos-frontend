"use client";

import { DataTable, EmptyState } from "@/components/ui";
import type { DataColumn } from "@/components/ui";
import type { BillingPage } from "../../hooks/billing/use-billing-page";
import { useAdminBillingLang } from "../../hooks/shared/use-admin-lang";
import type { AdminAuditEntry } from "../../types";
import { diffSummary, humanize } from "../../utils/billing";
import { day } from "./format";

/** Every admin billing action, newest first as the server sends them: who, what, why, and what changed. */
export function AuditTable({ page }: { page: BillingPage }) {
  const { b, lang, isAr } = useAdminBillingLang();
  const a = b.audit;
  const columns: DataColumn<AdminAuditEntry>[] = [
    { key: "date", header: a.date, cell: (row) => <span className="tabular-nums">{day(row.createdAt, lang)}</span> },
    { key: "actor", header: a.actor, cell: (row) => <span dir="ltr">{row.actor?.email ?? a.system}</span>, className: "hidden md:table-cell" },
    { key: "action", header: a.action, cell: (row) => <span className="font-medium text-text">{a.actions[row.action] ?? humanize(row.action)}</span> },
    { key: "target", header: a.target, cell: (row) => <span dir="auto">{row.target.email ?? row.target.subject ?? "—"}</span>, className: "hidden lg:table-cell" },
    { key: "reason", header: a.reason, mobileWide: true, cell: (row) => <span dir="auto" className="line-clamp-2">{row.reason || "—"}</span> },
    {
      key: "change",
      header: a.change,
      mobileWide: true,
      className: "hidden lg:table-cell",
      cell: (row) => {
        const changes = diffSummary(row.before, row.after);
        if (!changes.length) return <span className="text-text-muted">{a.noChange}</span>;
        return (
          <ul className="flex flex-col gap-space-1 text-caption">
            {changes.map((c) => (
              <li key={c.key} dir="ltr" className="text-start">
                <span className="text-text-muted">{c.key}: </span>
                {c.from} → {c.to}
              </li>
            ))}
          </ul>
        );
      },
    },
  ];
  const data = page.audit.data;
  return (
    <DataTable
      label={a.label}
      itemLabel={a.itemLabel}
      dir={isAr ? "rtl" : "ltr"}
      columns={columns}
      rows={data?.results}
      getRowId={(row) => row.id}
      getRowLabel={(row) => a.actions[row.action] ?? humanize(row.action)}
      loading={page.audit.loading && !data}
      error={page.audit.error && !data ? page.audit.error : null}
      onRetry={page.audit.reload}
      empty={<EmptyState icon="history" title={a.emptyTitle} description={a.emptyBody} />}
      paging={page.paging(data?.count ?? 0)}
      mobileCard={{ primary: "action", secondary: ["date", "reason"] }}
      stickyHeader={false}
    />
  );
}
