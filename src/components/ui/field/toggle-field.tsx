"use client";

import { useId } from "react";
import { Icon } from "../icon";
import { SwitchMark } from "../switch-mark";
import { useUiStrings } from "../ui-strings";

type ToggleFieldProps = {
  /** What the switch turns on. */
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** A line under the label; may differ per state ("Visible to clients" / "Hidden"). */
  description?: string | { on: string; off: string };
  disabled?: boolean;
  /** The change is being saved: the switch waits, busy, until it's done. */
  loading?: boolean;
  error?: string;
  /** What a screen reader hears while saving. Default "Saving…". */
  loadingLabel?: string;
};

/**
 * One setting as a card: the label and a line of explanation on one side, a
 * switch on the other, the whole card clickable. A real checkbox underneath,
 * so the keyboard and screen readers get a real control. While `loading`, it
 * can't be flipped again and says it's busy.
 */
const ToggleField = ({ label, checked, onChange, description, disabled = false, loading = false, error, loadingLabel }: ToggleFieldProps) => {
  const { t } = useUiStrings();
  const noteId = `${useId()}-note`;
  const line = typeof description === "string" ? description : description?.[checked ? "on" : "off"];
  return (
    <div className="flex w-full flex-col gap-space-2">
      <label
        // `relative`, so the visually hidden checkbox is positioned inside the
        // card and not against the page (which widened it in Arabic).
        className={`relative flex min-h-widget-row cursor-pointer items-center justify-between gap-space-5 rounded-widget px-space-6 py-space-5 transition-[background-color,box-shadow] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent has-disabled:cursor-not-allowed has-disabled:opacity-58 ${
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
          disabled={disabled || loading}
          aria-busy={loading || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? noteId : undefined}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <span className="flex shrink-0 items-center gap-space-3">
          {loading && (
            <span className="flex text-text-muted">
              <Icon name="circle-notch" size={16} className="animate-spin" />
              <span className="sr-only">{loadingLabel ?? t.saving}</span>
            </span>
          )}
          <SwitchMark checked={checked} />
        </span>
      </label>
      {error && (
        <span id={noteId} role="alert" className="text-caption text-danger">
          {error}
        </span>
      )}
    </div>
  );
};

export { ToggleField };
export type { ToggleFieldProps };
