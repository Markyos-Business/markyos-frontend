"use client";

import { useEffect, useRef, useState } from "react";
import type { DragEvent, KeyboardEvent, ReactNode } from "react";
import { useFieldArray, useFormContext, type ArrayPath, type FieldArray as RowValue, type FieldArrayWithId, type FieldValues } from "react-hook-form";
import { Button } from "../button/button";
import { IconButton } from "../button/icon-button";
import { EmptyState } from "../empty-state/empty-state";
import { Icon } from "../icon";
import { useFormMeta } from "./form-context";

type FieldArrayProps<V extends FieldValues, N extends ArrayPath<V>> = {
  name: N;
  /** The group's legend: "Reviewers". */
  legend: string;
  /** One row's name, numbered: (2) => "Reviewer 2". */
  rowLabel: (position: number) => string;
  /** The values a new row starts with. */
  newRow: () => RowValue<V, N>;
  /** The row's fields; name them `${name}.${index}.email`. */
  renderRow: (args: { index: number; field: FieldArrayWithId<V, N>; label: string }) => ReactNode;
  min?: number;
  max?: number;
  /** Drag by the handle, or focus the handle and use the up and down arrows. Default true. */
  reorderable?: boolean;
  /** "Add reviewer". Default "Add". */
  addLabel?: string;
  /** What shows with no rows: "No reviewers yet." */
  empty: { title: string; description: string; icon?: string };
  description?: string;
};

/**
 * A repeatable group of fields in a Form: reviewers, contacts, fees. Rows
 * add at the end and remove by their own button; `min` keeps the last ones
 * from going and `max` stops Add (saying why). With no rows it shows its
 * empty state. Rows reorder by dragging the grip, or from the keyboard:
 * focus the grip, then up and down; each move is announced ("Reviewer 2
 * moved to position 1 of 3.") and focus stays on the moved row's grip. An
 * error for the whole list ("Add at least one reviewer.") shows under it.
 */
function FieldArray<V extends FieldValues, N extends ArrayPath<V>>({ name, legend, rowLabel, newRow, renderRow, min = 0, max, reorderable = true, addLabel, empty, description }: FieldArrayProps<V, N>) {
  const meta = useFormMeta();
  const { control, formState, getFieldState } = useFormContext<V>();
  const { fields, append, remove, move } = useFieldArray<V, N>({ control, name });
  const [said, setSaid] = useState("");
  const [dragging, setDragging] = useState<number | null>(null);
  const grips = useRef<Record<string, HTMLButtonElement | null>>({});
  const refocus = useRef<string | null>(null);
  const full = max !== undefined && fields.length >= max;
  const atMin = fields.length <= min;
  // The list's own message (min/max from the schema), not its rows'.
  const listError = (getFieldState(name as never, formState).error as { message?: string; root?: { message?: string } } | undefined);
  const listMessage = listError?.root?.message ?? listError?.message;

  useEffect(() => {
    if (!refocus.current) return;
    grips.current[refocus.current]?.focus();
    refocus.current = null;
  });

  const shift = (from: number, to: number) => {
    if (to < 0 || to >= fields.length || from === to) return;
    refocus.current = fields[from].id;
    move(from, to);
    setSaid(meta.strings.moved(rowLabel(from + 1), to + 1, fields.length));
  };

  const onGripKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      shift(index, index + (e.key === "ArrowUp" ? -1 : 1));
    }
  };

  const drop = (e: DragEvent<HTMLLIElement>, index: number) => {
    e.preventDefault();
    if (dragging !== null) shift(dragging, index);
    setDragging(null);
  };

  return (
    <fieldset className="flex min-w-0 flex-col gap-space-4">
      <legend className="flex flex-col gap-space-1 text-h5 font-medium text-text">
        {legend}
        {description && <span className="text-caption font-normal text-text-muted">{description}</span>}
      </legend>
      {fields.length === 0 ? (
        <EmptyState icon={empty.icon ?? "users"} title={empty.title} description={empty.description} />
      ) : (
        <ol className="flex flex-col gap-space-3">
          {fields.map((field, index) => {
            const label = rowLabel(index + 1);
            return (
              <li
                key={field.id}
                aria-label={label}
                onDragOver={(e) => dragging !== null && e.preventDefault()}
                onDrop={(e) => drop(e, index)}
                className={`flex items-start gap-space-3 rounded-card bg-surface-2 p-space-4 shadow-edge transition-opacity duration-fast motion-reduce:transition-none ${dragging === index ? "opacity-50" : ""}`}
              >
                {reorderable && fields.length > 1 && (
                  <button
                    ref={(el) => {
                      grips.current[field.id] = el;
                    }}
                    type="button"
                    draggable
                    aria-label={meta.strings.moveRow(label)}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      setDragging(index);
                    }}
                    onDragEnd={() => setDragging(null)}
                    onKeyDown={(e) => onGripKey(e, index)}
                    className="mt-space-8 grid size-ctl-sm shrink-0 cursor-grab place-items-center rounded-md text-text-muted hover:text-text active:cursor-grabbing"
                  >
                    <Icon name="grip-vertical" size={18} />
                  </button>
                )}
                <div className="min-w-0 flex-1">{renderRow({ index, field, label })}</div>
                <IconButton icon="trash" label={meta.strings.removeRow(label)} disabled={atMin} title={atMin ? meta.strings.minRows(min) : undefined} onClick={() => remove(index)} className="mt-space-7 shrink-0" />
              </li>
            );
          })}
        </ol>
      )}
      <div className="flex flex-wrap items-center gap-space-4">
        <Button type="button" variant="secondary" size="sm" icon={<Icon name="plus" size={16} />} disabled={full} onClick={() => append(newRow())}>
          {addLabel ?? meta.strings.addRow}
        </Button>
        {full && <span className="text-caption text-text-muted">{meta.strings.maxRows(max!)}</span>}
      </div>
      {listMessage && (
        <p role="alert" className="px-space-5 text-caption text-danger">
          {listMessage}
        </p>
      )}
      <span aria-live="polite" className="sr-only">
        {said}
      </span>
    </fieldset>
  );
}

export { FieldArray };
export type { FieldArrayProps };
