"use client";

import { FilterBar, FilterSelectField, SearchField } from "@/components/ui";
import type { BillingPage } from "../../hooks/billing/use-billing-page";
import { useAdminBillingLang } from "../../hooks/shared/use-admin-lang";
import { CHECKOUT_STATUSES } from "../../utils/billing";

/** Search by brand or owner, filter by status and provider; all in the URL. */
export function CheckoutsFilters({ page }: { page: BillingPage }) {
  const { b } = useAdminBillingLang();
  const f = b.filters;
  return (
    <FilterBar
      active={page.filtered}
      filterCount={[page.values.status, page.values.provider].filter(Boolean).length}
      onClear={page.clearFilters}
      search={
        <SearchField
          key={page.searchKey}
          label={f.searchLabel}
          placeholder={f.search}
          defaultValue={page.searchSeed}
          onDebouncedChange={(q) => page.filters.set("q", q)}
        />
      }
    >
      <FilterSelectField
        label={f.status}
        hideLabel
        icon="filter"
        active={!!page.values.status}
        value={page.values.status}
        onChange={(value) => page.filters.set("status", value)}
        options={[{ value: "", label: f.allStatuses }, ...CHECKOUT_STATUSES.map((value) => ({ value, label: b.filterStatuses[value] }))]}
      />
      <FilterSelectField
        label={f.provider}
        hideLabel
        icon="credit-card"
        active={!!page.values.provider}
        value={page.values.provider}
        onChange={(value) => page.filters.set("provider", value)}
        options={[
          { value: "", label: f.allProviders },
          { value: "paypal", label: b.providers.paypal },
          { value: "comp", label: b.providers.comp },
          { value: "stripe", label: b.providers.stripe },
        ]}
      />
    </FilterBar>
  );
}
