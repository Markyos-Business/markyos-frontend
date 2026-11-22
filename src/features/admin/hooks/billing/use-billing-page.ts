"use client";

import { useMemo, useState } from "react";
import { useRequest } from "@/hooks/useRequest";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { listAudit, listCheckouts, listOrphans } from "../../api/admin-billing.api";
import type { AdminCheckoutQuery } from "../../types";

export const BILLING_TABS = ["checkouts", "orphans", "audit"] as const;
export type BillingTab = (typeof BILLING_TABS)[number];

/** The server's page size for checkouts and the audit log. */
export const BILLING_PAGE_SIZE = 25;

const FILTERS = { q: "", status: "", provider: "" } as const;
type FilterKey = keyof typeof FILTERS;

/**
 * The admin billing page: its tab, the checkouts' search and filters and
 * the page, all in the URL. Only the open tab is fetched.
 */
export function useBillingPage() {
  const filters = useUrlFilters({ tab: "checkouts", ...FILTERS });
  const { values, page } = filters;
  const tab: BillingTab = (BILLING_TABS as readonly string[]).includes(values.tab) ? (values.tab as BillingTab) : "checkouts";

  const query: AdminCheckoutQuery = useMemo(() => ({ q: values.q, status: values.status, provider: values.provider, page }), [values, page]);
  const checkoutsKey = tab === "checkouts" ? `checkouts:${JSON.stringify(query)}` : "checkouts:off";
  const checkouts = useRequest(() => (tab === "checkouts" ? listCheckouts(query) : Promise.resolve(null)), checkoutsKey);
  const orphans = useRequest(() => (tab === "orphans" ? listOrphans() : Promise.resolve(null)), `orphans:${tab === "orphans"}`);
  const audit = useRequest(() => (tab === "audit" ? listAudit(page) : Promise.resolve(null)), tab === "audit" ? `audit:${page}` : "audit:off");

  const filtered = (Object.keys(FILTERS) as FilterKey[]).some((k) => values[k] !== "");
  // The search box keeps its own text; bumping the key remounts it empty when the filters are cleared.
  const [searchKey, setSearchKey] = useState(0);
  const [searchSeed, setSearchSeed] = useState(values.q);
  const clearFilters = () => {
    filters.setMany({ q: "", status: "", provider: "" });
    setSearchSeed("");
    setSearchKey((k) => k + 1);
  };

  const paging = (total: number) => ({ page, pageSize: BILLING_PAGE_SIZE, total, onPageChange: filters.setPage });

  return {
    tab,
    // Changing tab drops the page and keeps the filters for when Checkouts comes back.
    setTab: (next: BillingTab) => filters.set("tab", next),
    values,
    filters,
    filtered,
    clearFilters,
    searchKey,
    searchSeed,
    checkouts,
    orphans,
    audit,
    paging,
  };
}

export type BillingPage = ReturnType<typeof useBillingPage>;
