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
        // Accent as text on a surface: darker than `accent` on the light
        // theme, so links and small labels keep their contrast.
        "accent-text": "var(--accent-text)",
        // Text and icons on an `accent-soft` fill.
        "accent-on-soft": "var(--accent-on-soft)",

        // The solid pill: the opposite of the ground in either theme.
        solid: "var(--solid)",
        "solid-ink": "var(--solid-ink)",

        // Borders are drawn as inset rings in these, not 1px borders.
        hairline: "var(--hairline)",
        "hairline-strong": "var(--hairline-strong)",

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
      keyframes: {
        // Something arrived that wasn't there a moment ago.
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(-3px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        // A panel swapped under a tab you pressed: the content moves, the
        // chrome doesn't.
        "tab-in": {
          "0%": { opacity: "0", transform: "translateY(5px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        "pop": {
          "0%": { opacity: "0", transform: "scale(0.94)" },
          "60%": { transform: "scale(1.01)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        // A side panel slides in from its own edge, so it says which edge to
        // send it back to. Pair one with its `rtl:` opposite in components.
        "panel-from-right": {
          "0%": { opacity: "0", transform: "translateX(8px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        "panel-from-left": {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 180ms cubic-bezier(0.2, 0.7, 0.3, 1) both",
        "tab-in": "tab-in 220ms cubic-bezier(0.2, 0.7, 0.3, 1) both",
        "pop": "pop 200ms cubic-bezier(0.2, 0.7, 0.3, 1) both",
        // Work is in progress and hasn't stalled: quicker than `animate-spin`.
        "spin-quick": "spin 720ms linear infinite",
        "panel-from-right": "panel-from-right 200ms cubic-bezier(0.2, 0.7, 0.3, 1) both",
        "panel-from-left": "panel-from-left 200ms cubic-bezier(0.2, 0.7, 0.3, 1) both",
        "toast-in": "toast-in 0.18s ease-out",
      },
    },
  },
};

export default config;
