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
  /**
   * One row of small tiles, icon over name, on every width; only the chosen
   * option's hint shows, once, under the row. For a short list where the
   * names already say most of it.
   */
  compact?: boolean;
  error?: string;
};

const COLUMNS = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" } as const;

/** Two or more cards acting as one single-choice group, each with a line of explanation. */
const RadioCardGroup = <T extends string>({ label, options, value, onChange, columns = 2, compact = false, error }: RadioCardGroupProps<T>) => {
  const chosen = options.find((o) => o.value === value);
  return (
    <div className="flex flex-col gap-space-2">
      <div
        role="radiogroup"
        aria-label={label}
        aria-invalid={error ? true : undefined}
        className={compact ? "grid grid-cols-3 gap-space-3" : `grid grid-cols-1 gap-space-4 ${COLUMNS[columns]}`}
      >
        {options.map(({ value: optionValue, label: name, hint, icon }) => {
          const active = value === optionValue;
          const fill = active ? "bg-accent-soft shadow-edge-accent" : `bg-surface-2 ${error ? "shadow-edge-danger" : "shadow-edge"}`;
          return (
            <button
              key={optionValue}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(optionValue)}
              className={`rounded-lg transition-[background-color,box-shadow] ${fill} ${
                compact
                  ? "flex flex-col items-center gap-space-2 px-space-3 py-space-5 text-center"
                  : "flex items-start gap-space-4 px-space-6 py-space-5 text-start"
              }`}
            >
              <Icon name={icon} size={compact ? 22 : 18} className={`shrink-0 ${active ? "text-accent-on-soft" : "text-text-muted"}`} />
              {compact ? (
                <span className={`text-body font-medium ${active ? "text-accent-on-soft" : "text-text"}`}>
                  {name}
                  {/* The tile shows no hint, so screen readers still hear what it means. */}
                  <span className="sr-only">. {hint}</span>
                </span>
              ) : (
                <span>
                  <span className={`block text-body font-medium ${active ? "text-accent-on-soft" : "text-text"}`}>{name}</span>
                  <span className="block text-caption text-text-muted">{hint}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
      {compact && chosen && <p className="px-space-4 text-caption text-text-muted">{chosen.hint}</p>}
      {error && (
        <span role="alert" className="text-caption text-danger">
          {error}
        </span>
      )}
    </div>
  );
};

export { RadioCardGroup };
export type { RadioCardGroupProps, RadioCardOption };
