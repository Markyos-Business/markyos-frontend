"use client";

import { Button } from "../../ui/buttons/Button";
import { IconButton } from "../../ui/buttons/IconButton";
import { Icon } from "../../ui/primitives/Icon";
import { inputClasses, labelClasses } from "../fields/InputField";
import { SelectInput, type SelectOption } from "../fields/SelectInput";

type RepeaterColumn = {
  key: string;
  label: string;
  type?: "text" | "number" | "email" | "url" | "select";
  placeholder?: string;
  /** For `select`. */
  options?: readonly SelectOption[];
};

type RepeaterRow = Record<string, string>;

type RepeaterFieldProps = {
  label: string;
  /** What one row is, for the add button and row headers: "fee", "contact". */
  rowLabel: string;
  columns: readonly RepeaterColumn[];
  rows: readonly RepeaterRow[];
  onChange: (rows: RepeaterRow[]) => void;
  /** Errors keyed `index.key`, e.g. "0.amount". */
  errors?: Record<string, string>;
  /** Where new rows go: `start` keeps them in view; `end` keeps an order that means something. */
  insertAt?: "start" | "end";
  /** How many columns wide the fields sit from `md` up. */
  layout?: 1 | 2 | 3 | 4;
  /** Rows that can't be removed: by default the last one stays. */
  minRows?: number;
};

const LAYOUTS: Record<1 | 2 | 3 | 4, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

/** A list of same-shaped entries (fees, contacts) the person can add to and remove from. */
const RepeaterField = ({
  label,
  rowLabel,
  columns,
  rows,
  onChange,
  errors = {},
  insertAt = "start",
  layout = 2,
  minRows = 1,
}: RepeaterFieldProps) => {
  const blank = (): RepeaterRow => Object.fromEntries(columns.map((c) => [c.key, ""]));
  const add = () => onChange(insertAt === "end" ? [...rows, blank()] : [blank(), ...rows]);
  const remove = (i: number) => rows.length > minRows && onChange(rows.filter((_, j) => j !== i));
  const set = (i: number, key: string, value: string) => onChange(rows.map((r, j) => (j === i ? { ...r, [key]: value } : r)));
  const addLabel = `Add ${rowLabel}`;

  return (
    <fieldset className="flex flex-col gap-space-6 rounded-card bg-surface-1 p-space-8 shadow-edge">
      <div className="flex items-center justify-between gap-space-5">
        <legend className="text-body font-medium text-text">{label}</legend>
        <Button variant="outline" size="sm" icon={<Icon name="plus" size={18} />} onClick={add}>
          {addLabel}
        </Button>
      </div>
      {rows.length === 0 && (
        <p className="rounded-lg border border-dashed border-line-strong py-space-8 text-center text-body text-text-muted">
          No entries yet. Use “{addLabel}” to add one.
        </p>
      )}
      {rows.map((row, i) => (
        <div key={i} className="flex flex-col gap-space-5 rounded-widget bg-surface-sunken p-space-6 shadow-edge-soft">
          <div className="flex items-center justify-between pb-space-3 shadow-rule-b">
            <span className="flex items-center gap-space-4">
              <span className="flex h-badge min-w-7.5 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-caption font-medium text-accent-on-soft">
                {i + 1}
              </span>
              <span className="text-body font-medium text-text-secondary">{rowLabel}</span>
            </span>
            <IconButton
              icon="trash"
              label={`Remove ${rowLabel} ${i + 1}`}
              disabled={rows.length <= minRows}
              onClick={() => remove(i)}
              className="text-text-muted not-disabled:hover:text-danger disabled:text-text-disabled"
            />
          </div>
          <div className={`grid grid-cols-1 gap-space-5 ${LAYOUTS[layout]}`}>
            {columns.map((c) => {
              const error = errors[`${i}.${c.key}`];
              const id = `${rowLabel}-${i}-${c.key}`;
              return (
                <div key={c.key} className="flex flex-col gap-space-2">
                  <label htmlFor={id} className={labelClasses}>
                    {c.label}
                  </label>
                  {c.type === "select" ? (
                    <SelectInput id={id} value={row[c.key] ?? ""} options={c.options ?? []} error={error} onChange={(e) => set(i, c.key, e.target.value)} />
                  ) : (
                    <input
                      id={id}
                      type={c.type ?? "text"}
                      value={row[c.key] ?? ""}
                      placeholder={c.placeholder}
                      aria-invalid={error ? true : undefined}
                      onChange={(e) => set(i, c.key, e.target.value)}
                      className={inputClasses}
                    />
                  )}
                  {error && (
                    <span role="alert" className="text-caption text-danger">
                      {error}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </fieldset>
  );
};

export { RepeaterField };
export type { RepeaterColumn, RepeaterFieldProps, RepeaterRow };
