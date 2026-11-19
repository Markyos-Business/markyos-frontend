"use client";

import type { Lang } from "@/types/lang";
import { pillSegment, pillSegmentStyle, pillTrack, pillTrackStyle } from "./choice/pill-segments";

type LangToggleProps = {
  value: Lang;
  onChange: (lang: Lang) => void;
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

/** EN | ع, drawn like every other "choose one" control (choice/pill-segments). */
const LangToggle = ({ value, onChange, label = "Preview language", scope = "preview" }: LangToggleProps) => {
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
  const segment = (lang: Lang, text: string, name: string, font: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={value === lang}
      aria-label={title(name)}
      title={title(name)}
      onClick={() => onChange(lang)}
      className={`${pillSegment(true)} ${font}`}
      style={pillSegmentStyle(value === lang)}
    >
      {text}
    </button>
  );

  return (
    <div role="radiogroup" aria-label={label} data-lang-toggle={scope} className={pillTrack} style={pillTrackStyle}>
      {segment("en", "EN", "English", "font-sans")}
      {segment("ar", "ع", "العربية", "font-arabic")}
    </div>
  );
};

export { LangToggle };
export type { LangToggleProps };
