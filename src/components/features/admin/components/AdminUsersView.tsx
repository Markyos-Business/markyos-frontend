"use client";

import { useEffect, useState } from "react";
import { AlertBanner, Avatar, Button, PageHeader, Table, TableEmptyRow, TableLoadingRow, cellClasses, rowClasses, Badge } from "@/components/ui";
import { SearchField, FilterSelectField } from "@/components/form";
import { usePresence } from "@/hooks/usePresence";
import { ORDERINGS, ROLE_LABELS, ROLE_TONES, STATUS_LABELS, STATUS_TONES } from "../constants";
import { useAdminUsers } from "../hooks/useAdminUsers";
import type { AdminUser, AdminUserQuery } from "../types";
import { formatDate, initialsOf } from "../utils/format";
import { AdminUserPanel } from "./AdminUserPanel";

const PAGE_SIZE = 25;

const COLUMNS = [
  { key: "person", label: "Person" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
  { key: "brands", label: "Brands", className: "hidden md:table-cell" },
  { key: "joined", label: "Joined", className: "hidden lg:table-cell" },
  { key: "last", label: "Last signed in", className: "hidden lg:table-cell" },
];

export function AdminUsersView() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<AdminUserQuery>({ ordering: "-created_at", page: 1 });
  // The selected account outlives the drawer being open, so the drawer still
  // has someone to show while it slides away.
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { mounted, closing } = usePresence(drawerOpen);
  const open = (u: AdminUser) => {
    setSelected(u);
    setDrawerOpen(true);
  };
  const { data, error, loading, reload } = useAdminUsers(query);

  // Wait for a pause in typing, so each keystroke isn't a request.
  useEffect(() => {
    const t = window.setTimeout(() => setQuery((q) => (q.search === search ? q : { ...q, search, page: 1 })), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  const set = (patch: Partial<AdminUserQuery>) => setQuery((q) => ({ ...q, ...patch, page: 1 }));
  const page = query.page ?? 1;
  const pages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  return (
    <>
      <PageHeader
        title="Users"
        description={data ? `${data.count} account${data.count === 1 ? "" : "s"}` : "Every account on Markyos"}
      />

      <div className="flex flex-wrap items-center gap-2.5">
        <SearchField label="Search users" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <FilterSelectField
          label="Role"
          hideLabel
          value={query.role ?? ""}
          onChange={(e) => set({ role: e.target.value as AdminUserQuery["role"] })}
          options={[{ value: "", label: "All roles" }, { value: "admin", label: "Admins" }, { value: "member", label: "Members" }]}
        />
        <FilterSelectField
          label="Status"
          hideLabel
          value={query.isActive ?? ""}
          onChange={(e) => set({ isActive: e.target.value as AdminUserQuery["isActive"] })}
          options={[{ value: "", label: "Any status" }, { value: "true", label: "Active" }, { value: "false", label: "Deactivated" }]}
        />
        <FilterSelectField
          label="Sort"
          hideLabel
          value={query.ordering ?? "-created_at"}
          onChange={(e) => set({ ordering: e.target.value })}
          options={ORDERINGS}
        />
      </div>

      <AlertBanner message={error} />

      <Table label="Users" columns={COLUMNS}>
        {loading && !data ? (
          <TableLoadingRow colSpan={COLUMNS.length} />
        ) : !data?.results.length ? (
          <TableEmptyRow colSpan={COLUMNS.length} title="No accounts match" description="Try another search or clear the filters." />
        ) : (
          data.results.map((u) => {
            const status = u.isActive ? "active" : "inactive";
            return (
              <tr
                key={u.id}
                onClick={() => open(u)}
                className={`${rowClasses} cursor-pointer hover:bg-surface-2`}
              >
                <td className={cellClasses}>
                  <button
                    type="button"
                    onClick={(e) => {
                      // The row opens it too; one open per click.
                      e.stopPropagation();
                      open(u);
                    }}
                    className="flex cursor-pointer items-center gap-3 text-start"
                  >
                    <Avatar initials={initialsOf(u.name)} size={32} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{u.name}</span>
                      <span className="block truncate text-caption text-text-muted">{u.email}</span>
                    </span>
                  </button>
                </td>
                <td className={cellClasses}>
                  <Badge tone={ROLE_TONES[u.role]}>{u.isSuperuser ? "Superuser" : ROLE_LABELS[u.role]}</Badge>
                </td>
                <td className={cellClasses}>
                  <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>
                </td>
                <td className={`${cellClasses} hidden text-text-secondary md:table-cell`}>
                  {u.brandsOwned} owned · {u.brandsMember} shared
                </td>
                <td className={`${cellClasses} hidden text-text-secondary lg:table-cell`}>{formatDate(u.createdAt)}</td>
                <td className={`${cellClasses} hidden text-text-secondary lg:table-cell`}>
                  {u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"}
                </td>
              </tr>
            );
          })
        )}
      </Table>

      {pages > 1 && (
        <div className="flex items-center justify-end gap-3 text-caption text-text-muted">
          <span>
            Page {page} of {pages}
          </span>
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setQuery((q) => ({ ...q, page: page - 1 }))}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setQuery((q) => ({ ...q, page: page + 1 }))}>
            Next
          </Button>
        </div>
      )}

      {mounted && selected && (
        <AdminUserPanel
          user={selected}
          closing={closing}
          onClose={() => setDrawerOpen(false)}
          onChange={(u) => {
            setSelected(u);
            reload();
          }}
        />
      )}
    </>
  );
}
