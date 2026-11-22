"use client";

import { ContentCard, DataTable, EmptyState, Tag } from "@/components/ui";
import { useBillingActions } from "../../hooks/billing/use-billing-actions";
import { useAdminBillingLang } from "../../hooks/shared/use-admin-lang";
import { CompDialog } from "../billing/comp-dialog";
import type { DataColumn } from "@/components/ui";
import { useAdminLang } from "../../hooks/shared/use-admin-lang";
import { useAdminUserBrands } from "../../hooks/user-detail/use-admin-user-brands";
import type { AdminUserBrand } from "../../types";
import { relativeTime } from "../../utils/format";

/** The brands this account owns or sits on a team of; an owned brand can be comped from its ⋯. */
export function UserBrands({ userId }: { userId: string }) {
  const { c, lang } = useAdminLang();
  const brands = useAdminUserBrands(userId);
  const { b } = useAdminBillingLang();
  // Comping is for the brands this account owns; the plan is the brand's.
  const billing = useBillingActions(() => undefined);
  const columns: DataColumn<AdminUserBrand>[] = [
    { key: "name", header: c.detail.brand, cell: (b) => <span dir="auto" className="font-medium text-text">{b.name}</span>, sortValue: (b) => b.name },
    { key: "stage", header: c.detail.stage, cell: (b) => c.stages[b.stage || "none"] ?? b.stage, sortValue: (b) => b.stage },
    {
      key: "role",
      header: c.table.role,
      cell: (b) => <Tag tone={b.role === "owner" ? "primary" : "neutral"}>{c.detail.brandRoles[b.role] ?? b.role}</Tag>,
      sortValue: (b) => b.role,
    },
    {
      key: "updated",
      header: c.detail.updated,
      cell: (b) => <span className="text-text-muted">{relativeTime(b.updatedAt, lang)}</span>,
      sortValue: (b) => b.updatedAt,
    },
  ];
  return (
    <ContentCard title={c.detail.brands} flush>
      <DataTable
        label={c.detail.brands}
        itemLabel={c.detail.brands}
        columns={columns}
        rows={brands.data ?? undefined}
        getRowId={(b) => b.id}
        getRowLabel={(b) => b.name}
        loading={brands.loading}
        error={brands.error}
        onRetry={brands.reload}
        empty={<EmptyState icon="swatchbook" title={c.detail.noBrandsTitle} description={c.detail.noBrandsBody} />}
        stickyHeader={false}
        rowActions={(row) =>
          row.role === "owner" ? [{ label: b.actions.comp, icon: "star", onSelect: () => billing.setCompFor({ id: row.id, name: row.name }) }] : []
        }
      />
      <CompDialog actions={billing} />
    </ContentCard>
  );
}
