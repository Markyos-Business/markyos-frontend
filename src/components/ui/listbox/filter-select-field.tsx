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
  /** `sm` is the 32px pill for a row's inline control (a member's role). */
  size?: "sm" | "md";
};

/**
 * A select for a toolbar or filter bar: the pill look, the kit's dropdown.
 */
const FilterSelectField = ({ label, hideLabel = false, icon, size = "md", ...rest }: FilterSelectFieldProps) => {
  const labelId = `fs-${useId()}`;
  return (
    <span className="flex items-center gap-space-3 text-caption text-text-muted">
      <span id={labelId} className={hideLabel ? "sr-only" : "font-medium"}>
        {label}
      </span>
      <Listbox
        {...rest}
        aria-labelledby={labelId}
        panelWidth={240}
        leading={icon ? <Icon name={icon} size={16} className="shrink-0 text-text-muted" /> : undefined}
        valueClassName={`font-medium text-text ${size === "sm" ? "text-caption" : ""}`}
        triggerClassName={`mk-btn max-w-72 rounded-lg bg-ink-soft text-text shadow-edge ${size === "sm" ? "h-8 px-space-4 text-caption" : "h-control-sm px-space-5 text-body"}`}
      />
    </span>
  );
};

export { FilterSelectField };
export type { FilterSelectFieldProps };
