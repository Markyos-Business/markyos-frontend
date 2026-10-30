"use client";

import { useMemo, useState } from "react";
import { useToast } from "@/components/ui";
import type { SortState } from "@/components/ui";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { listUsers } from "../../services/adminService";
import type { AdminUserQuery } from "../../types";
import { usersCsv } from "../../utils/csv";
import { useAdminLang } from "../shared/useAdminLang";
import { useAdminStats } from "../shared/useAdminStats";
import { useAdminUsers } from "./useAdminUsers";

const FILTERS = { q: "", role: "", status: "", type: "", lang: "", from: "", to: "" } as const;
const DEFAULTS = { ...FILTERS, sort: "-created_at", size: "20" };
type FilterKey = keyof typeof FILTERS;

// Table column → the server's `ordering` field.
const SORT_FIELDS: Record<string, string> = {
  user: "full_name",
  role: "role",
  status: "status",
  lastActive: "last_login",
  brands: "brands_owned",
  joined: "created_at",
};

/**
 * The users list: filters, sort, page and page size all live in the URL, so a
 * filtered view can be shared, reloaded or come back to with Back.
 */
export function useUsersPage() {
  const filters = useUrlFilters(DEFAULTS);
  const { values, page } = filters;
  const { c } = useAdminLang();
  const { showToast } = useToast();
  const stats = useAdminStats();
  const [selected, setSelected] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const query: AdminUserQuery = useMemo(
    () => ({
      search: values.q,
      role: values.role as AdminUserQuery["role"],
      status: values.status as AdminUserQuery["status"],
      accountType: values.type as AdminUserQuery["accountType"],
      language: values.lang as AdminUserQuery["language"],
      lastActiveFrom: values.from,
      lastActiveTo: values.to,
      ordering: values.sort,
      page,
      pageSize: Number(values.size),
    }),
    [values, page]
  );
  const users = useAdminUsers(query);

  // Sort and page size aren't filters: "Clear filters" leaves them be.
  const filtered = (Object.keys(FILTERS) as FilterKey[]).some((k) => values[k] !== "");
  // The search box keeps its own text while typing; bumping this remounts it
  // empty when the filters are cleared.
  // `searchSeed` is what it starts with: the URL's search on arrival, empty
  // after a clear (the URL catches up a moment later).
  const [searchKey, setSearchKey] = useState(0);
  const [searchSeed, setSearchSeed] = useState(values.q);
  const clearFilters = () => {
    filters.setMany(Object.fromEntries(Object.keys(FILTERS).map((k) => [k, ""])));
    setSearchSeed("");
    setSearchKey((k) => k + 1);
  };

  const desc = values.sort.startsWith("-");
  const field = values.sort.replace(/^-/, "");
  const sortKey = Object.keys(SORT_FIELDS).find((k) => SORT_FIELDS[k] === field) ?? "joined";
  const sort: SortState = { key: sortKey, dir: desc ? "desc" : "asc" };
  // A third click clears the sort: back to newest first.
  const setSort = (next: SortState) =>
    filters.set("sort", next ? `${next.dir === "desc" ? "-" : ""}${SORT_FIELDS[next.key] ?? "created_at"}` : "");

  /** Everything the filters match, not just this page, as a CSV download. */
  async function exportCsv() {
    setExporting(true);
    try {
      const rows = [];
      for (let p = 1; ; p++) {
        const res = await listUsers({ ...query, page: p, pageSize: 100 });
        rows.push(...res.results);
        if (!res.next) break;
      }
      const url = URL.createObjectURL(new Blob([usersCsv(rows)], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `markyos-users-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(c.exported(rows.length), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err), "danger");
    } finally {
      setExporting(false);
    }
  }

  function reload() {
    users.reload();
    stats.reload();
  }

  return {
    filters,
    values,
    filtered,
    clearFilters,
    searchKey,
    searchSeed,
    users,
    stats,
    reload,
    selected,
    setSelected,
    sort,
    setSort,
    paging: {
      page,
      pageSize: Number(values.size),
      total: users.data?.count ?? 0,
      onPageChange: filters.setPage,
      onPageSizeChange: (size: number) => filters.set("size", String(size)),
    },
    exportCsv,
    exporting,
  };
}
