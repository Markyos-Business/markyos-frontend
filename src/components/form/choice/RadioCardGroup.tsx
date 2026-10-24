"use client";

import { Icon } from "../../ui/primitives/Icon";

type RadioCardOption<T extends string> = {
  value: T;
  label: string;
  /** A line under the label saying what choosing it means. */
  hint: string;
  /** An icon name from the icon set. */
  icon: string;
};

type RadioCardGroupProps<T extends string> = {
  /** The group's accessible name. */
  label: string;
  options: RadioCardOption<T>[];
  /** `null` while nothing is chosen yet. */
  value: T | null;
  onChange: (value: T) => void;
  /** Cards per row from tablet width up; 1 stacks them as full-width rows. */
  columns?: 1 | 2 | 3;
  error?: string;
};

const COLUMNS = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" } as const;

/** Two or more cards acting as one single-choice group, each with a line of explanation. */
const RadioCardGroup = <T extends string>({ label, options, value, onChange, columns = 2, error }: RadioCardGroupProps<T>) => (
  <div className="flex flex-col gap-space-2">
    <div role="radiogroup" aria-label={label} aria-invalid={error ? true : undefined} className={`grid grid-cols-1 gap-space-4 ${COLUMNS[columns]}`}>
      {options.map(({ value: optionValue, label: name, hint, icon }) => {
        const active = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(optionValue)}
            className={`flex items-start gap-space-4 rounded-lg px-space-6 py-space-5 text-start transition-[background-color,box-shadow] ${
              active ? "bg-accent-soft shadow-edge-accent" : `bg-surface-2 ${error ? "shadow-edge-danger" : "shadow-edge"}`
            }`}
          >
            <Icon name={icon} size={18} className={`shrink-0 ${active ? "text-accent-on-soft" : "text-text-muted"}`} />
            <span>
              <span className={`block text-body font-medium ${active ? "text-accent-on-soft" : "text-text"}`}>{name}</span>
              <span className="block text-caption text-text-muted">{hint}</span>
            </span>
          </button>
        );
      })}
    </div>
    {error && (
      <span role="alert" className="text-caption text-danger">
        {error}
      </span>
    )}
  </div>
);

export { RadioCardGroup };
export type { RadioCardGroupProps, RadioCardOption };
