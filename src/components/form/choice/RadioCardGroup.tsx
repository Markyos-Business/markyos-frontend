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
  value: T;
  onChange: (value: T) => void;
};

/** Two or more cards acting as one single-choice group, each with a line of explanation. */
const RadioCardGroup = <T extends string>({ label, options, value, onChange }: RadioCardGroupProps<T>) => (
  <div role="radiogroup" aria-label={label} className="grid grid-cols-1 gap-space-4 sm:grid-cols-2">
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
            active ? "bg-accent-soft shadow-edge-accent" : "bg-surface-2 shadow-edge"
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
);

export { RadioCardGroup };
export type { RadioCardGroupProps, RadioCardOption };
