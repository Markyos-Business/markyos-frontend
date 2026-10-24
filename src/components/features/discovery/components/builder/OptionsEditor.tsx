"use client";

import { Button, Icon, IconButton } from "@/components/ui";
import { newOptionValue } from "../../model/defaults";
import type { Option } from "../../types";
import { LocalizedInput, type EditMode } from "./LocalizedInput";

type OptionsEditorProps = {
  options: Option[];
  onChange: (options: Option[]) => void;
  mode: EditMode;
  languages: ("en" | "ar")[];
  /** Once sent, labels can be reworded but options can't be added or removed. */
  locked: boolean;
  isAr: boolean;
  noun: { en: string; ar: string };
};

/** A choice's options (or a ranking's items), each labelled in both languages. */
export function OptionsEditor({ options, onChange, mode, languages, locked, isAr, noun }: OptionsEditorProps) {
  return (
    <div className="flex flex-col gap-space-5">
      {options.map((option, i) => (
        <div key={option.value} className="flex items-end gap-space-4">
          <div className="min-w-0 flex-1">
            <LocalizedInput
              label={{ en: `${noun.en} ${i + 1}`, ar: `${noun.ar} ${i + 1}` }}
              value={option.label}
              onCommit={(label) => onChange(options.map((o) => (o.value === option.value ? { ...o, label } : o)))}
              mode={mode}
              languages={languages}
              isAr={isAr}
            />
          </div>
          <IconButton
            icon="times"
            label={isAr ? `حذف ${noun.ar} ${i + 1}` : `Remove ${noun.en.toLowerCase()} ${i + 1}`}
            disabled={locked || options.length <= 2}
            onClick={() => onChange(options.filter((o) => o.value !== option.value))}
            className="text-text-muted hover:text-danger disabled:text-text-disabled"
          />
        </div>
      ))}
      <div>
        <Button
          variant="link"
          disabled={locked}
          onClick={() => onChange([...options, { value: newOptionValue(options), label: { en: null, ar: null } }])}
        >
          <Icon name="plus" size={16} />
          {isAr ? `إضافة ${noun.ar}` : `Add ${noun.en.toLowerCase()}`}
        </Button>
      </div>
    </div>
  );
}
