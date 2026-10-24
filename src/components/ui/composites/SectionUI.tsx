"use client";

import type { ReactNode } from "react";
import { Icon, AutoTextarea, RichText, RichTextEditor, richIsEmpty } from "@/components/ui";
import { Badge } from "../badges";

type SectionProps = {
  title: string;
  icon: string;
  /** Beside the title, e.g. a count or a toggle. */
  right?: ReactNode;
  children: ReactNode;
};

const Section = ({ title, icon, right, children }: SectionProps) => (
  // `mk-surface` is the edge. A fill alone puts `--surface-1` on `--canvas`,
  // which is 1.06:1 on the dark theme — a panel nobody can find the boundary
  // of. See the note in tailwind/base.js.
  <section className="mk-surface flex flex-col gap-4 rounded-2xl bg-surface-1 p-5">
    <div className="flex items-center gap-2.5">
      <Icon name={icon} size={17} className="text-accent-text" />
      {/*
       * An `h2`, not a `span`.
       *
       * These are the panels every settings, strategy and governance page is
       * built from, and they were styled as headings without being headings —
       * so a screen reader got one landmark per page and no way to move
       * between the sections of it. This is the structure sighted readers are
       * already being shown; the markup just did not say so.
       */}
      <h2 dir="auto" className="bidi-auto flex-1 text-ui-lg font-semibold">
        {title}
      </h2>
      {right}
    </div>
    {children}
  </section>
);

type RowProps = { label: string; hint?: string; right: ReactNode };

const Row = ({ label, hint, right }: RowProps) => (
  <div className="flex items-center justify-between gap-4">
    {/* Labels and hints are a mix of translated strings and untranslated
        English, and several interpolate counts and timestamps. Each picks
        its own base direction so a Latin hint keeps Latin layout — and its
        trailing full stop — inside the Arabic UI. */}
    <div>
      <div dir="auto" className="bidi-auto text-ui font-medium">
        {label}
      </div>
      {hint && (
        <div dir="auto" className="bidi-auto mt-0.5 text-ui-xs text-text-faint">
          {hint}
        </div>
      )}
    </div>
    {right}
  </div>
);

// The knob slides the same physical way in both writing directions, like the
// platform's own switch.
const knob = {
  on: "left-5.25", // physical-ok: see the note above
  off: "left-0.75", // physical-ok: see the note above
};

type SwitchProps = {
  checked: boolean;
  onToggle: () => void;
  label: string;
};

/**
 * `label` is required, not optional, on purpose.
 *
 * A `role="switch"` with no accessible name is announced as "switch, on" — the
 * state without the subject. Sighted users read the name from the `Row` beside
 * it; a screen reader has no idea the two are related, so the name has to be on
 * the control itself. Making it required means a new switch can't ship without
 * one.
 */
const Switch = ({ checked, onToggle, label }: SwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onToggle}
    className={`relative h-6 w-10.5 shrink-0 cursor-pointer rounded-full transition-colors ${
      checked ? "bg-accent shadow-none" : "bg-surface-2 shadow-edge"
    }`}
  >
    <span className={`absolute top-0.75 size-4.5 rounded-full bg-white transition-all ${checked ? knob.on : knob.off}`} />
  </button>
);

type EmptyHintProps = { children: ReactNode };

const EmptyHint = ({ children }: EmptyHintProps) => (
  <div className="mk-surface rounded-xl bg-surface-2 px-4 py-3.5 text-ui-xs text-text-faint">{children}</div>
);

type EditableFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  editing: boolean;
  multiline?: boolean;
  /** Edit as rich text — headings, lists, quotes, links and tables. */
  rich?: boolean;
  isAr?: boolean;
  onStart: () => void;
  onChange: (v: string) => void;
  onCommit: () => void;
};

const EditableField = ({
  label,
  placeholder,
  value,
  editing,
  multiline,
  rich,
  isAr,
  onStart,
  onChange,
  onCommit,
}: EditableFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-ui-2xs font-medium uppercase tracking-caps-wide text-text-faint">{label}</span>
    {editing && rich ? (
      <RichTextEditor value={value} onChange={onChange} onBlur={onCommit} placeholder={placeholder} isAr={isAr} autoFocus />
    ) : editing ? (
      /*
        One auto-growing textarea for both shapes.

        It used to be a 3-row textarea (or, for single-line fields, an
        `<input>`) while the read state was a button that grew to fit — so
        clicking a long statement to edit it shrank the field and hid most of
        the text. The editor now matches the read state's height exactly and
        keeps up as you type. `multiline` only sets how tall an *empty* field
        starts, and whether Enter commits or breaks the line.
      */
      <AutoTextarea
        value={value}
        onChange={onChange}
        onBlur={onCommit}
        onEnter={multiline ? undefined : onCommit}
        minRows={multiline ? 3 : 1}
        autoFocus
        aria-label={label}
        className="rounded-lg bg-surface-2 p-3 text-ui-md leading-prose text-text shadow-edge-accent outline-none"
      />
    ) : (
      <button
        type="button"
        onClick={onStart}
        dir="auto"
        /* p-3 + leading-prose mirror the editor exactly, so switching between
           reading and editing doesn't shift the text. whitespace-pre-wrap
           keeps paragraph breaks, which a plain button collapsed into one
           run-on block. */
        className={`bidi-auto cursor-pointer rounded-lg bg-surface-2 p-3 text-start text-ui-md leading-prose ${
          richIsEmpty(value) ? "text-text-faint" : "text-text"
        }${rich ? "" : " whitespace-pre-wrap"}`}
      >
        {/* A rich value renders as the markup it is; a plain one as text. */}
        {rich ? richIsEmpty(value) ? placeholder : <RichText value={value} /> : value || placeholder}
      </button>
    )}
  </div>
);

export { Badge, EditableField, EmptyHint, Row, Section, Switch };
export type { EditableFieldProps, EmptyHintProps, RowProps, SectionProps, SwitchProps };
