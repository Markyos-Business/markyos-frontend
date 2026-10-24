"use client";

import { useEffect, useRef, useState } from "react";
import type { LocalizedText } from "../../types";

export type EditMode = "en" | "ar" | "both";

type LocalizedInputProps = {
  label: { en: string; ar: string };
  value: LocalizedText;
  onCommit: (value: LocalizedText) => void;
  mode: EditMode;
  /** The form's languages: a one-language form has no field for the other. */
  languages: ("en" | "ar")[];
  multiline?: boolean;
  placeholder?: { en: string; ar: string };
  disabled?: boolean;
  isAr: boolean;
};

const IDLE_MS = 700;

/**
 * One piece of text in both languages, English and Arabic side by side.
 *
 * Each half is its own field with its own direction, so Arabic is typed
 * right to left whatever the studio's interface language. Edits are kept here
 * while typing and committed on blur or after a short pause, so a keystroke
 * never waits on the network.
 */
export function LocalizedInput({ label, value, onCommit, mode, languages, multiline = false, placeholder, disabled, isAr }: LocalizedInputProps) {
  const [draft, setDraft] = useState<LocalizedText>(value);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef(value);

  // A save that came back (or a different question) replaces the draft,
  // unless the field is mid-edit.
  useEffect(() => {
    latest.current = value;
    if (timer.current === undefined) setDraft(value);
  }, [value]);

  const commit = (next: LocalizedText) => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    if (next.en !== latest.current.en || next.ar !== latest.current.ar) onCommit(next);
  };

  const change = (lang: "en" | "ar", text: string) => {
    const next = { ...draft, [lang]: text };
    setDraft(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => commit(next), IDLE_MS);
  };

  const shown = (["en", "ar"] as const).filter((lang) => languages.includes(lang) && (mode === "both" || mode === lang));

  return (
    <div className={`grid gap-space-6 ${shown.length === 2 ? "md:grid-cols-2" : ""}`}>
      {shown.map((lang) => {
        const Field = multiline ? "textarea" : "input";
        return (
          <label key={lang} className="flex flex-col gap-space-2">
            <span className="text-caption text-text-muted">
              {label[isAr ? "ar" : "en"]}
              {shown.length === 2 || !languages.includes(isAr ? "ar" : "en") ? ` · ${lang === "en" ? "English" : "العربية"}` : ""}
            </span>
            <Field
              dir={lang === "ar" ? "rtl" : "ltr"}
              lang={lang}
              value={draft[lang] ?? ""}
              placeholder={placeholder?.[lang]}
              disabled={disabled}
              rows={multiline ? 2 : undefined}
              onChange={(e) => change(lang, e.target.value)}
              onBlur={() => commit(draft)}
              className={`mk-underline w-full ${multiline ? "resize-y" : ""} ${lang === "ar" ? "leading-[1.7]" : ""}`}
            />
          </label>
        );
      })}
    </div>
  );
}
