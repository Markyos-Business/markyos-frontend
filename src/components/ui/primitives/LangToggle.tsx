"use client";

import type { Lang } from "@/types/lang";

type LangToggleSize = "sm" | "md" | "lg";

const groupPadding: Record<LangToggleSize, string> = {
  sm: "p-0.5",
  md: "p-0.75",
  lg: "p-1",
};

// `sm` was 22x24 — under the 24px floor on both axes once the 9px type was
// measured rather than assumed.
const segmentSizes: Record<LangToggleSize, string> = {
  sm: "px-2.75 py-1.25 text-ui-3xs",
  md: "px-4 py-1.5 text-ui-xs",
  lg: "px-5.5 py-2.25 text-ui-lg",
};

// Drawn like text tabs (spec §6.11): the chosen language on a raised pill.
const segmentBase = "mk-tap justify-center rounded-md font-medium transition-[background-color,color,box-shadow] cursor-pointer";
const segmentState = (on: boolean) => (on ? "bg-surface-2 text-text shadow-edge" : "bg-transparent text-text-muted");

type LangToggleProps = {
  value: Lang;
  onChange: (lang: Lang) => void;
  size?: LangToggleSize;
  /**
   * The group's accessible name. Defaults to "Preview language", which is right
   * where a studio is previewing a guideline — and wrong on the client's
   * discovery brief, where nobody is previewing anything and the control
   * chooses the language they answer in.
   */
  label?: string;
  /**
   * Which of these this is, for the sweeps.
   *
   * The name a person reads is translated and differs per call site, so it
   * cannot be a selector. This can: "chrome" is the one in the top bar,
   * "preview" the one belonging to a guideline template.
   */
  scope?: string;
};

const LangToggle = ({ value, onChange, size = "md", label = "Preview language", scope = "preview" }: LangToggleProps) => {
  /*
   * Each segment carries the group's name in its tooltip.
   *
   * The builder shows three of these at once — the interface language, the
   * language the canvas previews, and the one belonging to the page being
   * previewed — and they are all a pill reading "EN | ع". The radiogroup's
   * `aria-label` already tells a screen reader which is which; this tells
   * everybody else, which is the half that was missing.
   */
  const title = (lang: string) => `${label} — ${lang}`;

  return (
    <div
      role="radiogroup"
      aria-label={label}
      data-lang-toggle={scope}
      className={`inline-flex rounded-lg bg-surface-sunken shadow-edge-soft ${groupPadding[size]}`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === "en"}
        aria-label={title("English")}
        title={title("English")}
        onClick={() => onChange("en")}
        className={`${segmentBase} ${segmentSizes[size]} font-sans ${segmentState(value === "en")}`}
      >
        EN
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "ar"}
        aria-label={title("العربية")}
        title={title("العربية")}
        onClick={() => onChange("ar")}
        className={`${segmentBase} ${segmentSizes[size]} font-arabic ${segmentState(value === "ar")}`}
      >
        ع
      </button>
    </div>
  );
};

export { LangToggle };
export type { LangToggleProps, LangToggleSize };
