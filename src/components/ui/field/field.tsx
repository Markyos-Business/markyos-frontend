"use client";

import { useId } from "react";
import type { ReactNode } from "react";
import { Icon } from "../icon";
import { Skeleton } from "../skeleton";
import { Tooltip } from "../tooltip";
import { useUiStrings } from "../ui-strings";

/** `md` is the form field; `sm` is the compact one for inspectors, dense panels and rows. */
type FieldSize = "sm" | "md";

/**
 * The states every field shares, as props, so one set of values drives any
 * control. `error` wins over `warning`, which wins over `success`; `hint` is
 * what shows when none of them does.
 */
type FieldState = {
  error?: string;
  warning?: string;
  success?: string;
  hint?: string;
  /** An async check is running (name taken? slug free?). Sets `aria-busy` and shows a spinner. */
  validating?: boolean;
  /** No permission to change it: read-only, with a lock and the reason as its note. */
  locked?: boolean;
  lockedReason?: string;
  readOnly?: boolean;
  disabled?: boolean;
  required?: boolean;
  /** Marks the label "Optional" instead of starring the required ones. */
  optional?: boolean;
  /** The form is still loading: a skeleton in the field's shape. */
  loading?: boolean;
};

/** What a control needs from its Field: spread it onto the real element. */
type ControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  "aria-required"?: true;
  "aria-busy"?: true;
  "aria-readonly"?: true;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
};

type FieldProps = FieldState & {
  label?: string;
  /** A short explanation behind an ⓘ next to the label. */
  info?: string;
  /** Beside the label, e.g. a "Forgot?" link. */
  labelRight?: ReactNode;
  /** Inside the field, before the value: an icon, "SAR", "https://". */
  prefix?: ReactNode;
  /** Inside the field, after the value: a unit, "%". */
  suffix?: ReactNode;
  /** A button at the field's end: Copy, Generate, Clear, a reveal eye. */
  action?: ReactNode;
  /** A character counter in the note row: the current length against `max`. */
  count?: { current: number; max: number };
  /** `horizontal` puts the label in a column beside the field from 640px up. */
  layout?: "vertical" | "horizontal";
  size?: FieldSize;
  /** Draw the control as is, without the field box: a group of boxes, an editor. */
  bare?: boolean;
  /**
   * The box's direction, for a value written left to right in any language
   * (a URL, a phone number, "SAR 84,500"): its prefix and value keep their
   * order on an Arabic page while the label follows the page.
   */
  boxDir?: "ltr" | "rtl";
  /** Between the box and the note: a strength meter, a preview. */
  below?: ReactNode;
  /** An id for the control; one is made if not given. */
  id?: string;
  /** Layout only (a width, `flex-1`), on the outer block. */
  className?: string;
  /** Overrides for the kit's words, so a page can pass its own language. */
  strings?: { optional?: string; locked?: string; checking?: string };
  /** The control, given the ids and states to put on it. */
  children: (control: ControlProps) => ReactNode;
};

/** The box classes for a size: `.mk-field` in tailwind/base.js, the one field look. */
const fieldClasses = (size: FieldSize = "md") => (size === "sm" ? "mk-field w-full mk-field-sm" : "mk-field w-full");

/** A field's title: 12px, muted, weight 400, at the value's inset. */
const labelClasses = "cursor-pointer px-space-5 text-caption text-text-muted";

/** The note's tone, in order of precedence. */
function noteOf({ error, warning, success, hint, locked, lockedReason }: FieldState) {
  if (error) return { text: error, tone: "error" as const };
  if (warning) return { text: warning, tone: "warning" as const };
  if (success) return { text: success, tone: "success" as const };
  if (locked && lockedReason) return { text: lockedReason, tone: "locked" as const };
  if (hint) return { text: hint, tone: "hint" as const };
  return null;
}

const NOTE_INK = { error: "text-danger", warning: "text-warning", success: "text-success", locked: "text-text-muted", hint: "text-text-faint" };

/**
 * The wrapper every field uses: label, the box with its parts, and one note.
 *
 * The control is a render prop so it stays the real element (an `<input>`, a
 * `<textarea>`): react-hook-form's `register` and a plain uncontrolled field
 * both work on it, and the label, hint and error are tied to it by id. The
 * note is a live region, so the result of an async check is announced when it
 * arrives; an error interrupts, anything else waits its turn.
 */
const Field = ({
  label,
  info,
  labelRight,
  prefix,
  suffix,
  action,
  count,
  layout = "vertical",
  size = "md",
  bare = false,
  boxDir,
  below,
  id: givenId,
  className = "",
  strings,
  children,
  ...state
}: FieldProps) => {
  const { t } = useUiStrings();
  const reactId = useId();
  const id = givenId ?? `f-${reactId}`;
  const noteId = `${id}-note`;
  const countId = `${id}-count`;
  const { error, warning, success, validating, locked, readOnly, disabled, required, optional, loading } = state;

  if (loading) {
    return (
      <div aria-busy="true" className={`flex w-full flex-col gap-space-2 ${className}`}>
        {label && <Skeleton className="ms-space-5 h-3 w-24 rounded-sm" />}
        <Skeleton className={`${size === "sm" ? "h-8" : "h-control-sm"} w-full rounded-sm`} />
      </div>
    );
  }

  const note = noteOf(state);
  const atLimit = count ? count.current >= count.max : false;
  const describedBy = [note ? noteId : null, count ? countId : null].filter(Boolean).join(" ") || undefined;
  const isReadOnly = Boolean(readOnly || locked);
  const control: ControlProps = {
    id,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
    "aria-required": required ? true : undefined,
    "aria-busy": validating ? true : undefined,
    "aria-readonly": isReadOnly ? true : undefined,
    required,
    disabled,
    readOnly: isReadOnly || undefined,
  };
  const dataState = error ? "error" : warning ? "warning" : success ? "success" : undefined;

  const trailing = (validating || locked || suffix || action) && (
    <span className="flex shrink-0 items-center gap-space-3 text-text-muted">
      {suffix}
      {validating && (
        <span className="flex">
          <Icon name="circle-notch" size={size === "sm" ? 16 : 18} className="animate-spin" />
          <span className="sr-only">{strings?.checking ?? t.checking}</span>
        </span>
      )}
      {locked && (
        <span className="flex">
          <Icon name="lock" size={size === "sm" ? 16 : 18} />
          <span className="sr-only">{strings?.locked ?? t.locked}</span>
        </span>
      )}
      {/* A 36px button in a 40px field: it overlaps the padding instead of
          growing the box, so a field with an action is as tall as one without. */}
      {action && <span className="-my-space-3 flex items-center">{action}</span>}
    </span>
  );

  const box = bare ? (
    children(control)
  ) : (
    <div
      dir={boxDir}
      className={`${fieldClasses(size)} flex items-center gap-space-3`}
      data-state={dataState}
      data-readonly={isReadOnly ? "" : undefined}
    >
      {prefix && <span className="flex shrink-0 items-center text-text-muted">{prefix}</span>}
      {children({ ...control })}
      {trailing}
    </div>
  );

  const labelRow = (label || labelRight) && (
    <div className="flex min-h-5 items-center justify-between gap-space-3 pe-space-5">
      {label && (
        <span className="flex items-center gap-space-2">
          <label id={`${id}-label`} htmlFor={id} className={labelClasses}>
            {label}
            {required && !optional && (
              <span aria-hidden className="ms-0.5 text-danger">
                *
              </span>
            )}
          </label>
          {optional && <span className="text-caption text-text-faint">{strings?.optional ?? t.optional}</span>}
          {info && (
            <Tooltip content={info}>
              <button type="button" aria-label={t.moreAbout(label)} className="mk-tap flex text-text-faint">
                <Icon name="info-circle" size={16} />
              </button>
            </Tooltip>
          )}
        </span>
      )}
      {labelRight}
    </div>
  );

  // Always in the page, so a live region exists before there is anything to
  // say; empty, it takes no room.
  const noteRow = (
    <div className={`flex items-start justify-between gap-space-4 px-space-5 text-caption ${note || count ? "" : "sr-only"}`}>
      <span id={noteId} aria-live={error ? "assertive" : "polite"} className={note ? NOTE_INK[note.tone] : ""}>
        {note?.text}
      </span>
      {count && (
        <span id={countId} className={`shrink-0 tabular-nums ${atLimit ? "text-danger" : "text-text-faint"}`} aria-label={t.characters(count.current, count.max)}>
          {count.current}/{count.max}
        </span>
      )}
    </div>
  );

  if (layout === "horizontal") {
    return (
      <div className={`relative flex w-full flex-col gap-space-2 sm:grid sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:items-start sm:gap-x-space-8 ${className}`}>
        <div className="sm:pt-space-4">{labelRow}</div>
        <div className="flex min-w-0 flex-col gap-space-2">
          {box}
          {below}
          {noteRow}
        </div>
      </div>
    );
  }

  return (
    // `relative` keeps the visually hidden note inside the field: positioned
    // against the page, it lands far off its start in Arabic and widens it.
    <div className={`relative flex w-full flex-col ${size === "sm" ? "gap-space-1" : "gap-space-2"} ${className}`}>
      {labelRow}
      {box}
      {below}
      {noteRow}
    </div>
  );
};

type FieldsetProps = {
  legend: string;
  /** A line under the legend. */
  description?: string;
  /** Fields side by side from 640px up. Default 1. */
  columns?: 1 | 2 | 3;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

const COLUMNS = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" };

/** A titled group of fields: a real `<fieldset>` and `<legend>`, so the group is announced. */
const Fieldset = ({ legend, description, columns = 1, disabled, className = "", children }: FieldsetProps) => (
  <fieldset disabled={disabled} className={`flex min-w-0 flex-col gap-space-6 ${className}`}>
    <legend className="flex flex-col gap-space-1 text-h5 font-medium text-text">
      {legend}
      {description && <span className="text-caption font-normal text-text-muted">{description}</span>}
    </legend>
    <div className={`grid grid-cols-1 gap-x-space-8 gap-y-space-6 ${COLUMNS[columns]}`}>{children}</div>
  </fieldset>
);

/** Fields that belong together on one row (city and postal code), without a legend. */
const FieldGroup = ({ columns = 2, className = "", children }: { columns?: 2 | 3; className?: string; children: ReactNode }) => (
  <div className={`grid grid-cols-1 gap-x-space-8 gap-y-space-6 ${COLUMNS[columns]} ${className}`}>{children}</div>
);

export { Field, FieldGroup, Fieldset, fieldClasses, labelClasses };
export type { ControlProps, FieldProps, FieldSize, FieldState, FieldsetProps };
