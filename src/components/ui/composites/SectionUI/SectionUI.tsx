"use client";

import { ReactNode } from "react";
import { Icon, AutoTextarea, RichText, RichTextEditor, richIsEmpty } from "@/components/ui";

export function Section({
  title,
  icon,
  right,
  children,
}: {
  title: string;
  icon: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    // `mk-surface` is the edge. A fill alone puts `--surface-1` on `--canvas`,
    // which is 1.06:1 on the dark theme — a panel nobody can find the boundary
    // of. See the note in tailwind/base.js.
    <section className="mk-surface rounded-2xl p-5 flex flex-col gap-4" style={{ background: "var(--surface-1)" }}>
      <div className="flex items-center gap-2.5">
        <Icon name={icon} size={17} style={{ color: "var(--accent-text)" }} />
        {/*
         * An `h2`, not a `span`.
         *
         * These are the panels every settings, strategy and governance page is
         * built from, and they were styled as headings without being headings —
         * so a screen reader got one landmark per page and no way to move
         * between the sections of it. This is the structure sighted readers are
         * already being shown; the markup just did not say so.
         */}
        <h2 dir="auto" className="bidi-auto font-semibold text-[15px] flex-1">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Row({ label, hint, right }: { label: string; hint?: string; right: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      {/* Labels and hints are a mix of translated strings and untranslated
          English, and several interpolate counts and timestamps. Each picks
          its own base direction so a Latin hint keeps Latin layout — and its
          trailing full stop — inside the Arabic UI. */}
      <div>
        <div dir="auto" className="bidi-auto text-[13px] font-medium">{label}</div>
        {hint && (
          <div dir="auto" className="bidi-auto text-[12px] mt-0.5" style={{ color: "var(--text-faint)" }}>
            {hint}
          </div>
        )}
      </div>
      {right}
    </div>
  );
}

/**
 * `label` is required, not optional, on purpose.
 *
 * A `role="switch"` with no accessible name is announced as "switch, on" — the
 * state without the subject. Sighted users read the name from the `Row` beside
 * it; a screen reader has no idea the two are related, so the name has to be on
 * the control itself. Making it required means a new switch can't ship without
 * one.
 */
export function Switch({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className="w-[42px] h-[24px] rounded-full relative shrink-0 cursor-pointer transition-colors"
      style={{
        background: checked ? "var(--accent)" : "var(--surface-2)",
        boxShadow: checked ? "none" : "inset 0 0 0 1px var(--hairline-strong)",
      }}
    >
      <span
        className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all"
        style={{ left: checked ? 21 : 3 }}
      />
    </button>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  const styles: Record<string, { background: string; color: string }> = {
    neutral: { background: "var(--surface-3)", color: "var(--text-muted)" },
    accent: { background: "var(--accent-soft)", color: "var(--accent-on-soft)" },
    success: { background: "rgba(124,231,172,.14)", color: "var(--success)" },
    warning: { background: "rgba(244,190,94,.14)", color: "var(--warning)" },
    danger: { background: "rgba(255,128,139,.14)", color: "var(--danger)" },
  };
  return (
    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0" style={styles[tone]}>
      {children}
    </span>
  );
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <div
      className="mk-surface rounded-xl px-4 py-3.5 text-[12px]"
      style={{ background: "var(--surface-2)", color: "var(--text-faint)" }}
    >
      {children}
    </div>
  );
}

export function EditableField({
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
}: {
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
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase" style={{ letterSpacing: ".08em", color: "var(--text-faint)" }}>
        {label}
      </span>
      {editing && rich ? (
        <RichTextEditor
          value={value}
          onChange={onChange}
          onBlur={onCommit}
          placeholder={placeholder}
          isAr={isAr}
          autoFocus
        />
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
          className="rounded-lg p-3 outline-none text-[14px] leading-[1.6]"
          style={{ background: "var(--surface-2)", color: "var(--text)", boxShadow: "inset 0 0 0 1px var(--accent-edge)" }}
        />
      ) : (
        <button
          type="button"
          onClick={onStart}
          dir="auto"
          /* p-3 + leading-[1.6] mirror the editor exactly, so switching between
             reading and editing doesn't shift the text. whitespace-pre-wrap
             keeps paragraph breaks, which a plain button collapsed into one
             run-on block. */
          className={`text-start rounded-lg p-3 text-[14px] leading-[1.6] cursor-pointer bidi-auto${
            rich ? "" : " whitespace-pre-wrap"
          }`}
          style={{ background: "var(--surface-2)", color: richIsEmpty(value) ? "var(--text-faint)" : "var(--text)" }}
        >
          {/* A rich value renders as the markup it is; a plain one as text. */}
          {rich ? (richIsEmpty(value) ? placeholder : <RichText value={value} />) : value || placeholder}
        </button>
      )}
    </div>
  );
}
