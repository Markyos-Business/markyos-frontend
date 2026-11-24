"use client";

import { FilterBar, FilterSelectField } from "@/components/ui";
import { PROMO_STATUSES } from "@/features/billing";
import type { BillingPage } from "../../hooks/billing/use-billing-page";
import { useAdminPromoLang } from "../../hooks/shared/use-admin-lang";
import { shortBatch } from "../../utils/promo";

/** Filter codes by batch and status; both in the URL. The batches offered are those in view, plus the chosen one. */
export function CodesFilters({ page }: { page: BillingPage }) {
  const { p } = useAdminPromoLang();
  const f = p.filters;
  const batches = [...new Set([...(page.codes.data?.results.map((r) => r.batchId) ?? []), page.values.batch].filter(Boolean))];
  return (
    <FilterBar active={page.codesFiltered} filterCount={[page.values.batch, page.values.codeStatus].filter(Boolean).length} onClear={page.clearCodeFilters}>
      <FilterSelectField
        label={f.batch}
        hideLabel
        icon="layer-group"
        active={!!page.values.batch}
        value={page.values.batch}
        onChange={(value) => page.filters.set("batch", value)}
        options={[{ value: "", label: f.allBatches }, ...batches.map((id) => ({ value: id, label: f.batchName(shortBatch(id)) }))]}
      />
      <FilterSelectField
        label={f.status}
        hideLabel
        icon="filter"
        active={!!page.values.codeStatus}
        value={page.values.codeStatus}
        onChange={(value) => page.filters.set("codeStatus", value)}
        options={[{ value: "", label: f.allStatuses }, ...PROMO_STATUSES.map((value) => ({ value, label: p.statuses[value] }))]}
      />
    </FilterBar>
  );
}
