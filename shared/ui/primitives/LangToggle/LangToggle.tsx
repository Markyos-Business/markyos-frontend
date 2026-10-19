"use client";

import type { Lang } from "@/shared/types/lang";

export function LangToggle({
  value,
  onChange,
  size = "md",
  /**
   * The group's accessible name. Defaults to "Preview language", which is right
   * where a studio is previewing a guideline — and wrong on the client's
   * discovery brief, where nobody is previewing anything and the control
   * chooses the language they answer in.
   */
  label = "Preview language",
  /**
   * Which of these this is, for the sweeps.
   *
   * The name a person reads is translated and differs per call site, so it
   * cannot be a selector. This can: "chrome" is the one in the top bar,
   * "preview" the one belonging to a guideline template.
   */
  scope = "preview",
}: {
  value: Lang;
  onChange: (lang: Lang) => void;
  size?: "sm" | "md" | "lg";
  label?: string;
  scope?: string;
}) {
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
  const pad = { sm: "2px", md: "3px", lg: "4px" }[size];
  // `sm` was 22x24 — under the 24px floor on both axes once the 9px type was
  // measured rather than assumed.
  const segPad = { sm: "5px 11px", md: "6px 16px", lg: "9px 22px" }[size];
  const fontSize = { sm: 9, md: 12, lg: 15 }[size];

  return (
    <div
      role="radiogroup"
      aria-label={label}
      data-lang-toggle={scope}
      className="inline-flex rounded-full"
      style={{ padding: pad, background: "var(--surface-1)" }}
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === "en"}
        aria-label={title("English")}
        title={title("English")}
        onClick={() => onChange("en")}
        className="mk-tap justify-center rounded-full font-semibold transition-colors cursor-pointer"
        style={{
          padding: segPad,
          fontSize,
          fontFamily: "var(--font-sans)",
          background: value === "en" ? "var(--solid)" : "transparent",
          color: value === "en" ? "var(--solid-ink)" : "var(--text-muted)",
        }}
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
        className="mk-tap justify-center rounded-full font-semibold transition-colors cursor-pointer"
        style={{
          padding: segPad,
          fontSize,
          fontFamily: "var(--font-arabic)",
          background: value === "ar" ? "var(--solid)" : "transparent",
          color: value === "ar" ? "var(--solid-ink)" : "var(--text-muted)",
        }}
      >
        ع
      </button>
    </div>
  );
}
