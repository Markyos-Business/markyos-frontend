"use client";

import { SwitchMark } from "../../ui/primitives/SwitchMark";

type ToggleFieldProps = {
  /** What the switch turns on. */
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** A line under the label; may differ per state ("Visible to clients" / "Hidden"). */
  description?: string | { on: string; off: string };
  disabled?: boolean;
  error?: string;
};

/**
 * One setting as a card: the label and a line of explanation on one side, a
 * switch on the other, the whole card clickable. A real checkbox underneath,
 * so the keyboard and screen readers get a real control.
 */
const ToggleField = ({ label, checked, onChange, description, disabled = false, error }: ToggleFieldProps) => {
  const line = typeof description === "string" ? description : description?.[checked ? "on" : "off"];
  return (
    <div className="flex w-full flex-col gap-space-2">
      <label
        className={`flex min-h-widget-row cursor-pointer items-center justify-between gap-space-5 rounded-widget px-space-6 py-space-5 transition-[background-color,box-shadow] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent has-disabled:cursor-not-allowed has-disabled:opacity-58 ${
          checked ? "bg-accent-soft shadow-edge-accent" : "bg-surface-1 shadow-edge"
        }`}
      >
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body font-medium text-text">{label}</span>
          {line && <span className="truncate text-caption text-text-muted">{line}</span>}
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <SwitchMark checked={checked} />
      </label>
      {error && (
        <span role="alert" className="text-caption text-danger">
          {error}
        </span>
      )}
    </div>
  );
};

export { ToggleField };
export type { ToggleFieldProps };
