"use client";

import { SwitchTrack } from "./SwitchTrack";
import { labelClasses } from "../fields/InputField";

type ToggleCardOption = { id: string; name: string };

type ToggleCardGroupProps = {
  label: string;
  options: readonly ToggleCardOption[];
  /** The ids switched on. */
  value: readonly string[];
  onChange: (value: string[]) => void;
  onLabel?: string;
  offLabel?: string;
  error?: string;
};

/** Several on/off settings as a grid of switch cards. */
const ToggleCardGroup = ({
  label,
  options,
  value,
  onChange,
  onLabel = "Enabled",
  offLabel = "Disabled",
  error,
}: ToggleCardGroupProps) => {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <fieldset className="flex w-full flex-col gap-space-3">
      <legend className={`${labelClasses} mb-space-3`}>{label}</legend>
      <div className="grid grid-cols-1 gap-space-5 md:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const on = value.includes(option.id);
          return (
            <label
              key={option.id}
              className={`group/toggle flex min-h-widget-row cursor-pointer items-center justify-between gap-space-4 rounded-widget px-space-6 py-space-5 transition-[background-color,box-shadow] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
                on ? "bg-accent-soft shadow-edge-accent" : "bg-surface-1 shadow-edge"
              }`}
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-body font-medium text-text">{option.name}</span>
                <span className="text-caption text-text-muted">{on ? onLabel : offLabel}</span>
              </span>
              <input type="checkbox" role="switch" checked={on} onChange={() => toggle(option.id)} className="sr-only" />
              <SwitchTrack />
            </label>
          );
        })}
      </div>
      {error && (
        <span role="alert" className="text-caption text-danger">
          {error}
        </span>
      )}
    </fieldset>
  );
};

export { ToggleCardGroup };
export type { ToggleCardGroupProps, ToggleCardOption };
