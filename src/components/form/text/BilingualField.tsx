"use client";

import { useId, useState } from "react";
import { useUiStrings } from "../../ui/i18n/uiStrings";
import { InputField } from "../fields/InputField";
import { TextareaField } from "../fields/TextareaField";
import { SegmentedToggle } from "../toggle/SegmentedToggle";
import type { FieldState } from "../field/Field";

type Bilingual = { en: string; ar: string };

type BilingualFieldProps = Omit<FieldState, "success"> & {
  label: string;
  value: Bilingual;
  onChange: (value: Bilingual) => void;
  /** `side` puts the two side by side from 640px up; `tabs` shows one at a time. */
  layout?: "side" | "tabs";
  multiline?: boolean;
  /** Errors per language, e.g. from zod. */
  errors?: Partial<Bilingual>;
  placeholder?: Partial<Bilingual>;
  maxLength?: number;
  onBlur?: () => void;
  className?: string;
  strings?: { english?: string; arabic?: string; needsArabic?: string };
};

/**
 * One value in English and Arabic. The Arabic side is always right to left
 * and `lang="ar"`, whatever the page's language. When English is filled and
 * Arabic isn't, it says "Needs Arabic." — a warning, not an error, because a
 * brand can publish in one language first. Controlled.
 */
const BilingualField = ({
  label,
  value,
  onChange,
  layout = "side",
  multiline = false,
  errors,
  placeholder,
  maxLength,
  onBlur,
  className = "",
  strings,
  warning,
  ...state
}: BilingualFieldProps) => {
  const { t } = useUiStrings();
  const groupId = useId();
  const [showAr, setShowAr] = useState(false);
  const needsArabic = value.en.trim() !== "" && value.ar.trim() === "";
  const arWarning = warning ?? (needsArabic ? (strings?.needsArabic ?? t.needsArabic) : undefined);
  const english = strings?.english ?? t.english;
  const arabic = strings?.arabic ?? t.arabic;
  const Control = multiline ? TextareaField : InputField;

  const side = (lang: "en" | "ar") => {
    const ar = lang === "ar";
    const shared = {
      ...state,
      label: layout === "tabs" ? undefined : ar ? arabic : english,
      "aria-label": layout === "tabs" ? `${label} (${ar ? arabic : english})` : undefined,
      value: value[lang],
      onChange: (e: { target: { value: string } }) => onChange({ ...value, [lang]: e.target.value }),
      onBlur,
      maxLength,
      showCount: Boolean(maxLength),
      placeholder: placeholder?.[lang],
      dir: ar ? "rtl" : "ltr",
      lang,
      error: errors?.[lang],
      warning: ar ? arWarning : undefined,
    } as const;
    return <Control key={lang} {...shared} autoGrow={multiline || undefined} />;
  };

  return (
    <fieldset aria-describedby={undefined} className={`flex min-w-0 flex-col gap-space-3 ${className}`}>
      <legend id={groupId} className="mb-space-2 flex w-full items-center justify-between gap-space-4 px-space-5 text-caption text-text-muted">
        <span>
          {label}
          {state.required && (
            <span aria-hidden className="ms-0.5 text-danger">
              *
            </span>
          )}
        </span>
      </legend>
      {layout === "tabs" ? (
        <>
          <SegmentedToggle label={label} off={{ label: "EN" }} on={{ label: needsArabic ? "AR •" : "AR" }} value={showAr} onChange={setShowAr} />
          {side(showAr ? "ar" : "en")}
          {/* On the English tab, the missing Arabic still has to be said. */}
          {!showAr && arWarning && <p className="px-space-5 text-caption text-warning">{arWarning}</p>}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-x-space-8 gap-y-space-6 sm:grid-cols-2">
          {side("en")}
          {side("ar")}
        </div>
      )}
    </fieldset>
  );
};

/** BilingualInput, by the UI library's name. */
const BilingualInput = BilingualField;

export { BilingualField, BilingualInput };
export type { Bilingual, BilingualFieldProps };
