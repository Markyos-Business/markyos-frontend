"use client";

import { useId } from "react";
import { Icon } from "../icon";
import { Listbox, type ListboxOption } from "./listbox";

type FilterSelectFieldProps = {
  /** Always required: it is the control's accessible name even when hidden. */
  label: string;
  /** Hide the label visually, for a filter bar where the options speak for it. */
  hideLabel?: boolean;
  /** An icon name shown inside the pill, before the value. */
  icon?: string;
  value: string;
  options: readonly ListboxOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  active?: boolean;
  /** `sm` is the 32px pill for a row's inline control (a member's role). */
  size?: "sm" | "md";
};

/**
 * A select for a toolbar or filter bar: the pill look, the kit's dropdown.
 */
const FilterSelectField = ({ label, hideLabel = false, icon, size = "md", active = false, ...rest }: FilterSelectFieldProps) => {
  const labelId = `fs-${useId()}`;
  return (
    <span title={rest.options.find(option => option.value === rest.value)?.label} data-filter-control data-active={active || undefined} className="flex min-w-0 items-center gap-space-3 text-caption text-text-muted group-data-[expanded=true]/filter-panel:flex-col group-data-[expanded=true]/filter-panel:items-stretch">
      <span id={labelId} className={hideLabel ? "sr-only font-medium group-data-[expanded=true]/filter-panel:not-sr-only" : "font-medium"}>
        {label}
      </span>
      <Listbox
        {...rest}
        aria-labelledby={labelId}
        panelWidth={240}
        leading={icon ? <Icon name={icon} size={16} className="shrink-0 text-text-muted" /> : undefined}
        valueClassName={`font-medium ${rest.disabled ? "text-text-disabled" : active ? "text-accent-on-soft" : "text-text"}`}
        // The field shape (MARKYOS_UI §2.6), not a box: a sort or filter
        // select beside a search field is the same control family. The active
        // tint comes from `[data-active]` on the wrapper (tailwind/base.js).
        triggerClassName={`mk-field min-w-0 max-w-72 text-text ${size === "sm" ? "mk-field-sm" : "text-body"}`}
      />
    </span>
  );
};

export { FilterSelectField };
export type { FilterSelectFieldProps };
