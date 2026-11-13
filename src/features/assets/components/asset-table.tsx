"use client";

import { useState } from "react";
import {
  AppDate,
  Avatar,
  Button,
  EmptyState,
  SearchField,
  StatusDot,
  SurfaceCard,
  Table,
  TableEmptyRow,
  TableLoadingRow,
  TablePagination,
  cellClasses,
  rowClasses,
  useUiStrings,
} from "@/components/ui";
import { initialsFor } from "@/lib/utils";
import { ASSETS_PER_PAGE, ASSET_STATUS_TONE } from "../constants";
import { useAssets } from "../hooks/use-assets";
import ar from "../i18n/ar.json";
import en from "../i18n/en.json";

type AssetTableProps = {
  /** Make the first load fail, to show the error state. */
  simulateError?: boolean;
  /** Show the library as if it had no assets, to show the empty state. */
  simulateEmpty?: boolean;
};

/**
 * The asset library as a table in a card: name and type, owner, market,
 * status, when the rights end and when it changed. Searchable and paged, with
 * its loading, empty, no-results and error states. Reads the interface
 * language from the kit, so it follows the app into Arabic.
 */
export function AssetTable({ simulateError = false, simulateEmpty = false }: AssetTableProps) {
  const { lang, isAr } = useUiStrings();
  const c = isAr ? ar : en;
  const { data, isLoading, error, refetch } = useAssets({ fail: simulateError });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const assets = simulateEmpty ? [] : (data ?? []);
  const q = query.trim().toLowerCase();
  const matches = q ? assets.filter((a) => [a.name, a.nameAr, a.owner, a.market].some((v) => v.toLowerCase().includes(q))) : assets;
  const pages = Math.max(1, Math.ceil(matches.length / ASSETS_PER_PAGE));
  const current = Math.min(page, pages);
  const shown = matches.slice((current - 1) * ASSETS_PER_PAGE, current * ASSETS_PER_PAGE);

  const columns = [
    { key: "name", label: c.columns.name },
    { key: "owner", label: c.columns.owner },
    { key: "market", label: c.columns.market, className: "hidden md:table-cell" },
    { key: "status", label: c.columns.status },
    { key: "rights", label: c.columns.rights, className: "hidden lg:table-cell" },
    { key: "updated", label: c.columns.updated, className: "hidden lg:table-cell" },
  ];

  if (error) {
    return (
      <SurfaceCard>
        <EmptyState
          icon="exclamation-circle"
          title={c.errorTitle}
          description={c.errorBody}
          action={<Button onClick={refetch}>{c.retry}</Button>}
        />
      </SurfaceCard>
    );
  }

  if (!isLoading && assets.length === 0) {
    return (
      <SurfaceCard>
        <EmptyState icon="file-alt" title={c.emptyTitle} description={c.emptyBody} />
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard padding="md" className="flex flex-col gap-space-6">
      <div className="flex flex-wrap items-center justify-between gap-space-5">
        <h2 className="text-h4 font-medium">{c.title}</h2>
        <SearchField
          label={c.search}
          placeholder={c.searchPlaceholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
      </div>
      <Table
        label={c.label}
        columns={columns}
        footer={
          !isLoading && matches.length > ASSETS_PER_PAGE ? (
            <TablePagination
              currentPage={current}
              onPageChange={setPage}
              itemsPerPage={ASSETS_PER_PAGE}
              itemCount={shown.length}
              totalCount={matches.length}
              itemLabel={c.items}
            />
          ) : undefined
        }
      >
        {isLoading ? (
          <TableLoadingRow colSpan={columns.length} rows={ASSETS_PER_PAGE} />
        ) : shown.length === 0 ? (
          <TableEmptyRow colSpan={columns.length} title={c.noResults.replace("{query}", query.trim())} description={c.noResultsHint} />
        ) : (
          shown.map((a) => (
            <tr key={a.id} className={rowClasses}>
              <td className={cellClasses}>
                <span className="flex flex-col">
                  <span className="font-medium text-text" lang={isAr ? "ar" : "en"}>
                    {isAr ? a.nameAr : a.name}
                  </span>
                  <span className="text-caption text-text-muted">{c.type[a.type]}</span>
                </span>
              </td>
              <td className={cellClasses}>
                <span className="flex items-center gap-space-3">
                  <Avatar initials={initialsFor(a.owner)} size={28} />
                  <span>{a.owner}</span>
                </span>
              </td>
              <td className={`${cellClasses} hidden md:table-cell`}>
                <bdi dir="ltr" className="font-mono text-caption text-text-muted">
                  {a.market}
                </bdi>
              </td>
              <td className={cellClasses}>
                <StatusDot tone={ASSET_STATUS_TONE[a.status]} label={c.status[a.status]} />
              </td>
              <td className={`${cellClasses} hidden lg:table-cell`}>
                {a.rightsExpiry ? <AppDate value={a.rightsExpiry} locale={lang} format="short" /> : <span className="text-text-muted">{c.noExpiry}</span>}
              </td>
              <td className={`${cellClasses} hidden lg:table-cell`}>
                <AppDate value={a.updatedAt} locale={lang} format="short" />
              </td>
            </tr>
          ))
        )}
      </Table>
    </SurfaceCard>
  );
}
