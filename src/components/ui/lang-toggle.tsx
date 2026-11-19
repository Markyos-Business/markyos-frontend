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

// `pill`: drawn like ThemeToggle, so the two sit side by side as one family
// (round track, round 28px segments, the chosen one raised in the accent).
// Colours inline, as ThemeToggle sets them, so nothing in the button base
// styles can repaint one segment differently from the other toggle.
const pillGroup = "inline-flex shrink-0 rounded-full p-0.5";
const pillGroupStyle = { background: "var(--surface-2)" };
const pillSegment = "grid size-7 cursor-pointer place-items-center rounded-full text-ui-3xs font-medium transition-[background-color,color]";
const pillSegmentStyle = (on: boolean) => ({ background: on ? "var(--surface-0)" : "transparent", color: on ? "var(--accent)" : "var(--text-faint)" });

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
  /** `pill` matches ThemeToggle; `segmented` (default) is the text-tab look. */
  shape?: "segmented" | "pill";
};

const LangToggle = ({ value, onChange, size = "md", label = "Preview language", scope = "preview", shape = "segmented" }: LangToggleProps) => {
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
      className={shape === "pill" ? pillGroup : `inline-flex rounded-lg bg-surface-sunken shadow-edge-soft ${groupPadding[size]}`}
      style={shape === "pill" ? pillGroupStyle : undefined}
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === "en"}
        aria-label={title("English")}
        title={title("English")}
        onClick={() => onChange("en")}
        className={shape === "pill" ? `${pillSegment} font-sans` : `${segmentBase} ${segmentSizes[size]} font-sans ${segmentState(value === "en")}`}
        style={shape === "pill" ? pillSegmentStyle(value === "en") : undefined}
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
        className={shape === "pill" ? `${pillSegment} font-arabic` : `${segmentBase} ${segmentSizes[size]} font-arabic ${segmentState(value === "ar")}`}
        style={shape === "pill" ? pillSegmentStyle(value === "ar") : undefined}
      >
        ع
      </button>
    </div>
  );
};

export { LangToggle };
export type { LangToggleProps, LangToggleSize };
