"use client";

import { useState } from "react";
import { DateRangeButton, FilterBar, FilterSelectField, SearchField, SegmentedToggle } from "@/components/form";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import type { StyleGuideCopy } from "../../constants";
import { Demo, GuideSection } from "./GuideParts";

/**
 * The list toolbar. The filters live in this page's URL, the same way the
 * Users list keeps them: reload and they are still set.
 */
const InputsSection = ({ c }: { c: StyleGuideCopy }) => {
  const filters = useUrlFilters({ q: "", role: "", status: "", from: "", to: "" });
  const [grid, setGrid] = useState(false);
  const [debounced, setDebounced] = useState("");
  const { values } = filters;

  return (
    <GuideSection id="inputs" title={c.sections.inputs}>
      <Demo name="FilterBar · SearchField · FilterSelectField · DateRangeButton" className="flex flex-col gap-space-5">
        <FilterBar
          active={filters.active}
          onClear={filters.clear}
          search={
            <SearchField
              label={c.searchLabel}
              placeholder={c.search}
              defaultValue={values.q}
              onDebouncedChange={(q) => filters.set("q", q)}
            />
          }
        >
          <FilterSelectField
            label={c.role}
            hideLabel
            icon="user-shield"
            value={values.role}
            onChange={(e) => filters.set("role", e.target.value)}
            options={[
              { value: "", label: c.allRoles },
              { value: "admin", label: c.table.roles.admin },
              { value: "member", label: c.table.roles.member },
            ]}
          />
          <FilterSelectField
            label={c.status}
            hideLabel
            icon="filter"
            value={values.status}
            onChange={(e) => filters.set("status", e.target.value)}
            options={[
              { value: "", label: c.allStatuses },
              { value: "active", label: c.table.active },
              { value: "waiting", label: c.table.waiting },
            ]}
          />
          <DateRangeButton
            value={{ from: values.from || undefined, to: values.to || undefined }}
            onChange={(range) => filters.setMany({ from: range.from ?? "", to: range.to ?? "" })}
          />
        </FilterBar>
        <p dir="ltr" className="text-caption text-text-muted">
          ?{new URLSearchParams(Object.entries(values).filter(([, v]) => v)).toString() || "—"}
        </p>
      </Demo>

      <div className="grid gap-5 lg:grid-cols-2">
        <Demo name="SearchField · shortcut + debounce" className="flex flex-col gap-space-4">
          <SearchField label={c.searchLabel} placeholder={c.search} shortcut onDebouncedChange={setDebounced} />
          <p dir="auto" className="text-caption text-text-muted">
            {debounced || "—"}
          </p>
        </Demo>
        <Demo name="SegmentedToggle">
          <SegmentedToggle
            label={c.view}
            off={{ label: c.list, icon: "list-ul" }}
            on={{ label: c.grid, icon: "th-large" }}
            value={grid}
            onChange={setGrid}
          />
        </Demo>
      </div>
    </GuideSection>
  );
};

export { InputsSection };
