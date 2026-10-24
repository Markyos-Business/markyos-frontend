"use client";

import { Icon } from "../primitives/Icon";

type FilterChipProps = {
  label: string;
  onRemove: () => void;
  /** The remove button's accessible name; defaults to "Remove <label> filter". */
  removeLabel?: string;
};

/** An active filter: the spec's removable Tag (§6.7), on the accent tint. */
const FilterChip = ({ label, onRemove, removeLabel }: FilterChipProps) => (
  <span className="inline-flex h-tag shrink-0 items-center gap-space-1 whitespace-nowrap rounded-lg bg-accent-soft ps-space-5 pe-space-2 text-body font-medium text-accent-on-soft">
    {label}
    <button
      type="button"
      onClick={onRemove}
      aria-label={removeLabel ?? `Remove ${label} filter`}
      className="flex size-6.5 items-center justify-center rounded-md"
    >
      <Icon name="times" size={16} />
    </button>
  </span>
);

export { FilterChip };
export type { FilterChipProps };
