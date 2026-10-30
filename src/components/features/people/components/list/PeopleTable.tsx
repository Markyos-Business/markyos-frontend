"use client";

import { Avatar, Button, DataTable, EmptyState, Icon, Tag } from "@/components/ui";
import type { ActionItem, DataColumn } from "@/components/ui";
import { initialsFor } from "@/lib/utils";
import { ROLE_TONE } from "../../constants";
import { usePeopleLang } from "../../hooks/usePeopleLang";
import type { PeoplePage } from "../../hooks/usePeoplePage";
import type { Person } from "../../types";

type PeopleTableProps = {
  page: PeoplePage;
  onInvite: () => void;
  onRemoveEverywhere: (person: Person) => void;
};

/** Everyone on your brands: who they are, and their role on each brand. */
export function PeopleTable({ page, onInvite, onRemoveEverywhere }: PeopleTableProps) {
  const { c } = usePeopleLang();
  const t = c.table;

  const columns: DataColumn<Person>[] = [
    {
      key: "person",
      header: t.person,
      sortValue: (p) => p.name,
      cell: (p) => (
        <div className="flex min-w-0 items-center gap-space-4">
          <Avatar initials={initialsFor(p.name)} size={32} />
          <div className="min-w-0">
            <div dir="auto" className="truncate font-medium text-text">
              {p.name}
            </div>
            <div dir="ltr" className="truncate text-start text-caption text-text-muted">
              {p.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "brands",
      header: t.brands,
      sortable: false,
      cell: (p) => (
        <div className="flex flex-wrap gap-space-3">
          {p.brands.map((b) => (
            <Tag key={b.workspaceId} tone={ROLE_TONE[b.role]}>
              <span dir="auto">{b.brandName}</span> · {c.roles[b.role]}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      key: "count",
      header: t.count,
      sortValue: (p) => p.brands.length,
      cell: (p) => <span className="text-text-muted">{t.countValue(p.brands.length)}</span>,
      className: "hidden md:table-cell",
    },
  ];

  const rowActions = (p: Person): ActionItem[] => [
    { label: c.actions.manage, icon: "user-shield", onSelect: () => page.openPerson(p) },
    { label: c.actions.removeAll, icon: "user-slash", tone: "danger", onSelect: () => onRemoveEverywhere(p) },
  ];

  const empty =
    page.owned.length === 0 ? (
      <EmptyState icon="swatchbook" title={c.empty.noBrandsTitle} description={c.empty.noBrandsBody} />
    ) : page.filtered ? (
      <EmptyState
        icon="search"
        title={c.empty.noMatchTitle(page.query.trim())}
        description={c.empty.noMatchBody}
        action={
          <Button variant="outline" size="sm" onClick={page.clearFilters}>
            {c.empty.clear}
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon="users"
        title={c.empty.noPeopleTitle}
        description={c.empty.noPeopleBody}
        action={
          <Button variant="primary" size="sm" icon={<Icon name="user-plus" size={18} />} onClick={onInvite}>
            {c.invite}
          </Button>
        }
      />
    );

  return (
    <DataTable
      label={t.label}
      itemLabel={t.itemLabel}
      columns={columns}
      rows={page.shown}
      getRowId={(p) => p.email}
      getRowLabel={(p) => p.name}
      empty={empty}
      onRowClick={page.openPerson}
      rowActions={rowActions}
      pageSizes={[20, 50, 100]}
      stickyHeader={false}
    />
  );
}
