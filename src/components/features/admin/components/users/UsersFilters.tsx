"use client";

import { DateRangeButton, FilterBar, FilterSelectField, SearchField } from "@/components/form";
import { ACCOUNT_TYPE_KEYS } from "@/constants/accountTypes";
import { useAdminLang } from "../../hooks/useAdminLang";
import type { useUsersPage } from "../../hooks/useUsersPage";

type UsersFiltersProps = Pick<ReturnType<typeof useUsersPage>, "filters" | "values" | "filtered" | "clearFilters" | "searchKey" | "searchSeed">;

/** Search, role, status, type, language and last active, kept in the URL. */
export function UsersFilters({ filters, values, filtered, clearFilters, searchKey, searchSeed }: UsersFiltersProps) {
  const { c } = useAdminLang();
  const f = c.filters;
  return (
    <FilterBar
      active={filtered}
      onClear={clearFilters}
      search={
        <SearchField
          // Remounts when the filters are cleared, so the box empties too.
          key={searchKey}
          label={f.searchLabel}
          placeholder={f.search}
          defaultValue={searchSeed}
          shortcut
          onDebouncedChange={(q) => filters.set("q", q)}
        />
      }
    >
      <FilterSelectField
        label={f.role}
        hideLabel
        icon="user-shield"
        value={values.role}
        onChange={(e) => filters.set("role", e.target.value)}
        options={[
          { value: "", label: f.allRoles },
          { value: "admin", label: c.roles.admin },
          { value: "member", label: c.roles.member },
        ]}
      />
      <FilterSelectField
        label={f.status}
        hideLabel
        icon="filter"
        value={values.status}
        onChange={(e) => filters.set("status", e.target.value)}
        options={[
          { value: "", label: f.allStatuses },
          { value: "active", label: c.statuses.active },
          { value: "waiting", label: c.statuses.waiting },
          { value: "deactivated", label: c.statuses.deactivated },
        ]}
      />
      <FilterSelectField
        label={f.type}
        hideLabel
        icon="users"
        value={values.type}
        onChange={(e) => filters.set("type", e.target.value)}
        options={[{ value: "", label: f.allTypes }, ...ACCOUNT_TYPE_KEYS.map((key) => ({ value: key, label: c.types[key] }))]}
      />
      <FilterSelectField
        label={f.language}
        hideLabel
        icon="language"
        value={values.lang}
        onChange={(e) => filters.set("lang", e.target.value)}
        options={[
          { value: "", label: f.allLanguages },
          { value: "en", label: c.locales.en },
          { value: "ar", label: c.locales.ar },
          { value: "none", label: f.followsBrand },
        ]}
      />
      <DateRangeButton
        label={f.lastActive}
        placeholder={f.lastActive}
        value={{ from: values.from || undefined, to: values.to || undefined }}
        onChange={(range) => filters.setMany({ from: range.from ?? "", to: range.to ?? "" })}
      />
    </FilterBar>
  );
}
