/**
 * Markyos's whole styling setup. The CSS entry (src/app/tailwind.css) only
 * loads Tailwind and points here; everything else lives in this file and the
 * modules beside it:
 *
 *   tailwind/tokens.js  the design tokens, as CSS custom properties, for the
 *                       dark theme (default) and the light theme
 *   tailwind/icons.js   the icon set, drawn as CSS masks
 *   tailwind/base.js    element defaults and the shared classes the markup
 *                       relies on (rich text, the live editor, focus, motion)
 *
 * The theme below names the tokens for Tailwind, so `bg-surface-1` and an
 * inline `var(--surface-1)` resolve to the same value, and both repaint when
 * the theme changes.
 *
 * Content scanning is automatic in Tailwind v4, so there is no `content` list,
 * and no RTL plugin: logical utilities (`ms-*`, `ps-*`, `start-*`, `text-start`)
 * and the `rtl:` variant are built in.
 *
 * Everything sits under `extend`, so Tailwind's own scales (colours such as
 * `black`/`white`, spacing, the `sm`–`2xl` breakpoints) are still there.
 *
 * @type {import("tailwindcss").Config}
 */
import plugin from "tailwindcss/plugin";
import { baseStyles } from "./tailwind/base.js";
import { iconStyles } from "./tailwind/icons.js";
import { darkTokens, lightTokens } from "./tailwind/tokens.js";

/** Widths as a percentage of the parent: `1p` (1%) up to `99p` (99%). */
const percentWidths = Object.fromEntries(
  Array.from({ length: 99 }, (_, i) => [`${i + 1}p`, `${i + 1}%`])
);

const config = {
  // Light and dark come from `data-theme` on <html>, which the theme toggle
  // sets (see contexts/ThemeProvider). The colour tokens switch on their own;
  // `dark:` is for the rare thing that has to differ beyond a token.
  darkMode: ["selector", '[data-theme="dark"]'],
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
        // Text on a solid `accent` fill, and the accent's focus ring and edge.
        "accent-ink": "var(--accent-ink)",
        "accent-ring": "var(--accent-ring)",
        "accent-edge": "var(--accent-edge)",

        // The solid pill: the opposite of the ground in either theme.
        solid: "var(--solid)",
        "solid-ink": "var(--solid-ink)",

        // Borders are drawn as inset rings in these, not 1px borders.
        hairline: "var(--hairline)",
        "hairline-strong": "var(--hairline-strong)",
        "chip-edge": "var(--chip-edge)",

        text: "var(--text)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "text-faint": "var(--text-faint)",

        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        // Tinted fills behind a status badge's text.
        "success-soft": "rgba(124, 231, 172, 0.14)",
        "warning-soft": "rgba(244, 190, 94, 0.14)",
        "danger-soft": "rgba(255, 128, 139, 0.14)",
        // Text on a solid status or danger fill.
        "status-ink": "var(--status-ink)",
        "danger-ink": "var(--danger-ink)",

        // The dim layer behind a modal, and text placed on it.
        scrim: "var(--scrim)",
        "scrim-ink": "var(--scrim-ink)",

        // ── Brand ───────────────────────────────────────────────────────────
        // The Markyos brand from the design system (project/_ds, tokens/
        // colors.css): 500 is Primary #5E81F4 and 700 is Primary deep #1B51E5,
        // both verbatim. The other steps are mixed from them, lighter towards
        // white and darker towards the ink #1C1D21. Static, the same in both
        // themes: for the logo, marketing, charts and illustrations. Interface
        // chrome keeps using the tokens above, which switch with the theme.
        brand: {
          50: "#f2f5fe",
          100: "#e5ebfd",
          200: "#ccd7fc",
          300: "#afc0fa",
          400: "#86a1f7",
          500: "#5e81f4",
          600: "#3c69ec",
          700: "#1b51e5",
          800: "#1b44b4",
          900: "#1c3783",
          950: "#1c2d5c",
          DEFAULT: "#5e81f4",
          deep: "#1b51e5",
          ink: "#1c1d21",
          grey: "#8181a5",
        },
        // The design system's secondary palette, verbatim.
        secondary: {
          indigo: "#9698d6",
          cyan: "#40e1fa",
          red: "#ff808b",
          green: "#7ce7ac",
          yellow: "#f4be5e",
          violet: "#cb68fe",
        },
      },
      fontFamily: {
        display: "var(--font-display)",
        sans: "var(--font-sans)",
        arabic: "var(--font-arabic)",
        mono: "var(--font-mono)",
      },
      fontSize: {
        // Tailwind's scale, spelled out so it reads the same as our other
        // projects.
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
        "8xl": ["6rem", { lineHeight: "1" }],
        "9xl": ["8rem", { lineHeight: "1" }],
        // The studio's interface scale. Every step keeps the 1.5 line height
        // the page inherits, so swapping a pixel size for one of these never
        // moves a line.
        "ui-3xs": ["0.5625rem", { lineHeight: "1.5" }],
        "ui-2xs": ["0.6875rem", { lineHeight: "1.5" }],
        "ui-xs": ["0.75rem", { lineHeight: "1.5" }],
        "ui-sm": ["0.78125rem", { lineHeight: "1.5" }],
        ui: ["0.8125rem", { lineHeight: "1.5" }],
        "ui-plus": ["0.84375rem", { lineHeight: "1.5" }],
        "ui-md": ["0.875rem", { lineHeight: "1.5" }],
        "ui-lg": ["0.9375rem", { lineHeight: "1.5" }],
        // Headings: a dialog title, a stat, the page title.
        "title-sm": ["1.125rem", { lineHeight: "1.5" }],
        title: ["1.375rem", { lineHeight: "1.5" }],
        display: ["2rem", { lineHeight: "1.5" }],
      },
      lineHeight: {
        // Body copy in dialogs and settings rows: a touch looser than normal.
        prose: "1.6",
      },
      letterSpacing: {
        // Small uppercase labels, such as table headers.
        caps: "0.06em",
        // Field labels above an editable value.
        "caps-wide": "0.08em",
      },
      width: percentWidths,
      backgroundImage: {
        // A flat tint laid over a fill, for hover and press states that have
        // to keep the fill underneath.
        "hover-veil": "linear-gradient(var(--hover-veil), var(--hover-veil))",
        "press-veil": "linear-gradient(var(--press-veil), var(--press-veil))",
      },
      boxShadow: {
        // Elevation, already tuned per theme.
        pop: "var(--shadow-pop)",
        modal: "var(--shadow-modal)",
        // Edges are drawn as inset shadows, not borders, so they take no
        // space and never shift a layout.
        edge: "inset 0 0 0 1px var(--hairline-strong)",
        "edge-soft": "inset 0 0 0 1px var(--hairline)",
        "edge-accent": "inset 0 0 0 1px var(--accent-edge)",
        "edge-pop": "0 0 0 1px var(--hairline-strong), var(--shadow-pop)",
        "edge-modal": "0 0 0 1px var(--hairline-strong), var(--shadow-modal)",
        // A field whose content has been accepted, e.g. a typed confirmation.
        "edge-valid": "inset 0 0 0 1px var(--success)",
        // A rich-text editor while it is open.
        "edge-editing": "inset 0 0 0 1px rgba(0, 153, 255, 0.5)",
        // A toast's edge says how it went.
        "edge-success": "inset 0 0 0 1px rgba(124, 231, 172, 0.5)",
        "edge-danger": "inset 0 0 0 1px rgba(255, 128, 139, 0.5)",
        // A one-pixel rule along one side: under a header, over a footer.
        "rule-b": "inset 0 -1px 0 var(--hairline)",
        "rule-t": "inset 0 1px 0 var(--hairline)",
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
        // A page's content settling in after navigation.
        "page-enter": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // A slow breathing glow for something waiting on you.
        "glow-pulse": {
          "0%, 100%": { opacity: "0.25" },
          "50%": { opacity: "0.45" },
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
        "page-enter": "page-enter 0.25s ease-out both",
        // The curve is CSS's own ease-in-out, written out: the keyword in
        // this file would be read as a class and generate a utility.
        "glow-pulse": "glow-pulse 6s cubic-bezier(0.42, 0, 0.58, 1) infinite",
      },
      screens: {
        // Tailwind's `sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280 / `2xl` 1536
        // stay as they are: every responsive layout is built on them. These
        // add wide screens. For "below a size" use the built-in `max-*`
        // variants (`max-md:` is everything under 768px).
        "3xl": "1600px",
        "4xl": "1850px",
      },
    },
  },
  plugins: [
    // Registered as base styles, in the order the old stylesheet had them:
    // the icons, then the tokens, then everything else.
    plugin(({ addBase }) => {
      addBase(iconStyles);
      addBase({ ":root": darkTokens, ':root[data-theme="light"]': lightTokens });
      addBase(baseStyles);
    }),
  ],
};

export default config;
