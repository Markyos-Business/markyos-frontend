/**
 * Tailwind's theme for Markyos, loaded by `@config` in app/globals.css.
 *
 * Every value points at a design token rather than repeating it. The tokens
 * themselves stay CSS custom properties in globals.css, because they switch
 * between the dark and light themes at runtime and the contrast audit reads
 * them from there. This file only names them for Tailwind, so the colour, font
 * and radius utilities resolve to the same values the inline `var(--…)` styles
 * use.
 *
 * Content scanning is automatic in Tailwind v4, so there is no `content` list.
 *
 * @type {import("tailwindcss").Config}
 */
const config = {
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        "surface-0": "var(--surface-0)",
        "surface-1": "var(--surface-1)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",

        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",

        text: "var(--text)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "text-faint": "var(--text-faint)",

        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      fontFamily: {
        display: "var(--font-display)",
        sans: "var(--font-sans)",
        arabic: "var(--font-arabic)",
        mono: "var(--font-mono)",
      },
      borderRadius: {
        card: "16px",
        widget: "10px",
        pill: "999px",
      },
    },
  },
};

export default config;
