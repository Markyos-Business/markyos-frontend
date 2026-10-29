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
 * Colours are written out directly, both themes at once, as the fallback of
 * their token: `var(--surface-1, light-dark(lightValue, darkValue))`. The
 * variable always wins at runtime, and that is deliberate: the guideline site
 * re-points `--surface-*`, `--text-*` and `--hairline*` inside a section with
 * its own brand background (guideline-site/model/blockStyle.ts), and a literal
 * colour could not follow it. The variables live in tailwind/tokens.js, for
 * inline styles and the contrast audit too; tailwind/colors.test.js fails if a
 * value here ever disagrees with its token.
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
import { darkTokens, lightTokens, specAliases } from "./tailwind/tokens.js";

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
        // Surfaces (spec §2.3): black canvas, #111 cards, #1A1A1A raised
        // fills, #242424 above that.
        canvas: "var(--canvas, light-dark(#ffffff, #000000))",
        sidebar: "var(--sidebar, light-dark(#fafafa, #000000))",
        "surface-0": "var(--surface-0, light-dark(#ffffff, #111111))",
        "surface-1": "var(--surface-1, light-dark(#ffffff, #111111))",
        "surface-2": "var(--surface-2, light-dark(#f5f5f5, #1a1a1a))",
        "surface-3": "var(--surface-3, light-dark(#ededed, #242424))",
        // The unread or highlighted row, and widget rows / sunken areas.
        "surface-highlight": "var(--surface-highlight, light-dark(#fafafa, #161616))",
        "surface-sunken": "var(--surface-sunken, light-dark(rgba(10, 10, 10, 0.03), rgba(255, 255, 255, 0.04)))",

        // The one accent, #0099FF, and its deep step for pressed states.
        accent: "var(--accent, light-dark(#0055ff, #0099ff))",
        "accent-deep": "var(--accent-deep, light-dark(#0044cc, #0055ff))",
        "accent-soft": "var(--accent-soft, light-dark(#e6eeff, rgba(0, 153, 255, 0.14)))",
        // Accent as text on a surface: lifted on dark, deeper on light, so
        // links and small labels keep their contrast.
        "accent-text": "var(--accent-text, light-dark(#0055ff, #5cb9ff))",
        // Text and icons on an `accent-soft` fill.
        "accent-on-soft": "var(--accent-on-soft, light-dark(#0055ff, #85caff))",
        // Text on a solid `accent` fill, and the accent's focus ring and edge.
        "accent-ink": "var(--accent-ink, light-dark(#ffffff, #0b0b0d))",
        "accent-ring": "var(--accent-ring, light-dark(rgba(0, 85, 255, 0.22), rgba(0, 153, 255, 0.18)))",
        "accent-edge": "var(--accent-edge, light-dark(rgba(0, 85, 255, 0.55), rgba(0, 153, 255, 0.55)))",

        // The inverted pill: the opposite of the ground in either theme.
        solid: "var(--solid, light-dark(#0a0a0a, #ffffff))",
        "solid-ink": "var(--solid-ink, light-dark(#ffffff, #090909))",

        // Borders are drawn as inset rings in these, not 1px borders. The one
        // real border, an input's underline, rests in `line-strong`.
        hairline: "var(--hairline, light-dark(#e5e5e5, rgba(255, 255, 255, 0.05)))",
        "hairline-strong": "var(--hairline-strong, light-dark(rgba(10, 10, 10, 0.106), rgba(255, 255, 255, 0.1)))",
        "line-strong": "var(--line-strong, light-dark(rgba(10, 10, 10, 0.32), rgba(255, 255, 255, 0.2)))",
        "chip-edge": "var(--chip-edge, rgba(130, 130, 138, 0.5))",

        // Hierarchy by lightness, never by hue: heading, body, muted, faint,
        // and `text-disabled` for placeholders and disabled labels only.
        text: "var(--text, light-dark(#0a0a0a, #ffffff))",
        "text-secondary": "var(--text-secondary, light-dark(#171717, #dbdbdb))",
        "text-muted": "var(--text-muted, light-dark(#6b6b6b, #c4c4c4))",
        "text-faint": "var(--text-faint, light-dark(#6b6b6b, #afafaf))",
        "text-disabled": "var(--text-disabled, light-dark(rgba(10, 10, 10, 0.4), rgba(255, 255, 255, 0.4)))",

        // Status, for status only. `danger` is the text tone; `danger-fill`
        // is the spec's red for dots, bars and solid badges.
        success: "var(--success, light-dark(#007a52, #00de68))",
        warning: "var(--warning, light-dark(#8a5c00, #ffbb00))",
        attention: "var(--attention, light-dark(#7a3400, #ffb37a))",
        danger: "var(--danger, light-dark(#c80009, #ff8fb4))",
        "danger-fill": "var(--danger-fill, light-dark(#e7000b, #ff0066))",
        info: "var(--info, light-dark(#004a5f, #00ccff))",
        // The tint rule: each soft fill is its own hue at about 14%.
        "success-soft": "var(--success-soft, light-dark(#e6f5ef, rgba(0, 222, 104, 0.14)))",
        "warning-soft": "var(--warning-soft, light-dark(#fbf3e6, rgba(255, 187, 0, 0.14)))",
        "danger-soft": "var(--danger-soft, light-dark(#fdecec, rgba(255, 0, 102, 0.14)))",
        "info-soft": "var(--info-soft, light-dark(rgba(0, 74, 95, 0.08), rgba(0, 204, 255, 0.14)))",
        // Indigo as a tag tone (Tag `indigo`): the ink and its 14% tint. The
        // fixed secondary indigo below stays for charts.
        indigo: "var(--indigo, light-dark(#4c28c0, #c5b3ff))",
        "indigo-soft": "var(--indigo-soft, light-dark(#f0ebff, rgba(138, 88, 255, 0.16)))",
        "attention-soft": "var(--attention-soft, light-dark(rgba(122, 52, 0, 0.07), rgba(255, 179, 122, 0.12)))",
        // A neutral soft fill (the outline button, a progress track) and a
        // switch's off track.
        "ink-soft": "var(--ink-soft, light-dark(rgba(10, 10, 10, 0.06), rgba(255, 255, 255, 0.1)))",
        track: "var(--track, light-dark(#bdbdbd, #333333))",
        // Text on a solid status or danger fill.
        "status-ink": "var(--status-ink, light-dark(#ffffff, #0b0b0d))",
        "danger-ink": "var(--danger-ink, light-dark(#ffffff, #0b0b0d))",

        // The dim layer behind a modal, and text placed on it.
        scrim: "var(--scrim, rgba(9, 9, 9, 0.62))",
        "scrim-ink": "var(--scrim-ink, #ffffff)",

        // ── Brand ───────────────────────────────────────────────────────────
        // The Markyos brand blue from the design system (docs/MARKYOS_UI.md):
        // 500 is #0099FF and 700 is the deep #0055FF, both verbatim; the other
        // steps are mixed towards white and black. Static, the same in both
        // themes: for the logo, marketing and illustrations. Interface chrome
        // uses the tokens above, which switch with the theme.
        brand: {
          50: "#e6f5ff",
          100: "#cceaff",
          200: "#99d6ff",
          300: "#66c2ff",
          400: "#33adff",
          500: "#0099ff",
          600: "#0077ff",
          700: "#0055ff",
          800: "#0044cc",
          900: "#003399",
          950: "#001f5c",
          DEFAULT: "#0099ff",
          deep: "#0055ff",
          black: "#000000",
          white: "#ffffff",
        },
        // The design system's secondary palette, verbatim: charts only,
        // never chrome. Series order is accent, green, yellow, red, cyan,
        // indigo.
        secondary: {
          indigo: "#8a58ff",
          "indigo-ink": "#a98bff",
          cyan: "#00ccff",
          "cyan-alt": "#22dddd",
          red: "#ff0066",
          green: "#00de68",
          "green-light": "#4cd963",
          yellow: "#ffbb00",
          violet: "#9900ff",
        },
      },
      fontFamily: {
        // Product UI is Inter throughout; `display` is the heading stack and
        // is Inter too. Bricolage is `brand`: the wordmark and marketing only.
        display: "var(--font-display)",
        sans: "var(--font-sans)",
        brand: "var(--font-brand)",
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
        // The design system's fixed scale (spec §3), with its own line
        // heights: 32 / 26 / 20 / 18 / 16 for headings, 14 body, 12 caption
        // (the spec's "secondary"). Headings, values, labels and buttons are
        // weight 500, body and captions 400; nothing heavier.
        h1: ["2rem", { lineHeight: "3rem" }],
        h2: ["1.625rem", { lineHeight: "2.5rem" }],
        h3: ["1.25rem", { lineHeight: "2rem" }],
        h4: ["1.125rem", { lineHeight: "1.6875rem" }],
        h5: ["1rem", { lineHeight: "1.5rem" }],
        body: ["0.875rem", { lineHeight: "1.3125rem" }],
        caption: ["0.75rem", { lineHeight: "1.125rem" }],
        // The only place caps appear (pair with `uppercase`): tab labels,
        // SORT:, PREV, NEXT, VIEW ALL. Never type copy in caps.
        overline: ["0.75rem", { lineHeight: "1", fontWeight: "500" }],
      },
      fontWeight: {
        // The heaviest weight in the product UI is 500 (spec §1.9). These two
        // are pinned to it so a stray `font-semibold` or `font-bold` can't
        // render heavier than the design allows; write `font-medium`.
        semibold: "500",
        bold: "500",
      },
      spacing: {
        // The design system's measured spacing (spec §2.4). Not a 4/8 grid:
        // don't round these. Tailwind's numeric scale is still there for
        // everything else.
        "space-1": "4px",
        "space-2": "5px",
        "space-3": "8px",
        "space-4": "10px",
        "space-5": "14px",
        "space-6": "18px",
        "space-7": "19px",
        "space-8": "25px",
        "space-9": "26px",
        "space-10": "32px",
        "space-11": "40px",
        // Fixed component metrics (spec §1.12), for h-, w-, size- and min-h-.
        control: "46px", // buttons and icon buttons
        "control-sm": "40px", // tabs, pagination cells
        field: "72px", // input block: title, value and underline
        tag: "36px",
        "status-tag": "28px",
        badge: "24px",
        rail: "84px", // nav rail width
        "rail-item": "64px",
        "rail-item-box": "48px",
        topbar: "84px",
        "widget-row": "72px",
      },
      borderRadius: {
        // Radius encodes size class (spec §2.5). Tailwind's own sm 4px,
        // md 6px and lg 8px already match the spec's checkbox / status tag /
        // button steps; these are the ones Tailwind's scale doesn't have.
        spark: "10px", // spark counter
        switch: "12px",
        card: "15px", // cards, counters
        widget: "15px", // widget rows
        feature: "25px", // marketing feature cards
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
      zIndex: {
        // The stacking order, from the page up. Local stacking inside one
        // component (z-10, z-20) stays numeric.
        sticky: "40",
        dropdown: "50",
        modal: "50",
        toast: "100",
        dialog: "120",
      },
      // Motion (spec §1.8): `duration-fast` (120ms) for colour, opacity and
      // shadow, `duration-base` (180ms) for switch knobs and progress fills,
      // on the one `ease-standard` curve. A bare `transition` gets both by
      // default. Never a raw number.
      transitionDuration: {
        DEFAULT: "var(--duration-fast)",
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
      },
      transitionTimingFunction: {
        DEFAULT: "var(--ease-standard)",
        standard: "var(--ease-standard)",
      },
      width: percentWidths,
      backgroundImage: {
        // A flat tint laid over a fill, for hover and press states that have
        // to keep the fill underneath.
        "hover-veil": "linear-gradient(var(--hover-veil), var(--hover-veil))",
        "press-veil": "linear-gradient(var(--press-veil), var(--press-veil))",
        // The light sweeping across a loading skeleton.
        shimmer: "linear-gradient(90deg, transparent, var(--hover-veil), transparent)",
      },
      boxShadow: {
        // Elevation. Cards never get one: `raised` (and its existing names
        // `pop` and `modal`) is for menus and overlays only.
        soft: "var(--shadow-soft)",
        raised: "var(--shadow-raised)",
        pop: "var(--shadow-pop)",
        modal: "var(--shadow-modal)",
        // Light, for active, focus and highlight only (about 2% of a layout).
        glow: "var(--glow-primary)",
        "glow-soft": "var(--glow-soft)",
        // A presence dot's halo, the colour of the card under it.
        "ring-status": "0 0 0 2px var(--surface-1)",
        // Edges are drawn as inset shadows, not borders, so they take no
        // space and never shift a layout.
        edge: "inset 0 0 0 1px var(--hairline-strong)",
        "edge-soft": "inset 0 0 0 1px var(--hairline)",
        "edge-accent": "inset 0 0 0 1px var(--accent-edge)",
        // The full-strength accent edge (spec `--inset-primary`).
        "edge-primary": "inset 0 0 0 1px var(--accent)",
        "edge-pop": "0 0 0 1px var(--hairline-strong), var(--shadow-pop)",
        "edge-modal": "0 0 0 1px var(--hairline-strong), var(--shadow-modal)",
        // A rich-text editor while it is open: the accent, at half strength.
        "edge-editing": "inset 0 0 0 1px light-dark(rgba(0, 98, 184, 0.5), rgba(0, 153, 255, 0.5))",
        // Something went right or wrong: a toast, a typed confirmation that
        // now matches.
        "edge-success": "inset 0 0 0 1px light-dark(rgba(8, 82, 48, 0.5), rgba(124, 231, 172, 0.5))",
        "edge-danger": "inset 0 0 0 1px light-dark(rgba(138, 24, 36, 0.5), rgba(255, 128, 139, 0.5))",
        // A one-pixel rule along one side: under a header, over a footer.
        "rule-b": "inset 0 -1px 0 var(--hairline)",
        "rule-t": "inset 0 1px 0 var(--hairline)",
      },
      dropShadow: {
        // Chart lines emit light: `drop-shadow-glow` on the line's SVG.
        glow: ["0 0 6px rgba(0, 153, 255, 0.8)", "0 0 18px rgba(0, 85, 255, 0.5)"],
      },
      keyframes: {
        // Something that opens or closes (a menu, a dialog and its scrim, a
        // drawer, a toast) crossfades. Opacity only: no slide, no scale, and
        // nothing animates in just because it mounted (spec §1.8).
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        // The light crossing a loading skeleton.
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in var(--duration-fast) var(--ease-standard) both",
        "fade-out": "fade-out var(--duration-fast) var(--ease-standard) both",
        // Ambient loading feedback, not an interaction, so it loops.
        shimmer: "shimmer 1.4s var(--ease-standard) infinite",
        // Work is in progress and hasn't stalled: quicker than `animate-spin`.
        "spin-quick": "spin 720ms linear infinite",
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
    // Tailwind's own `hover:` already applies only under `(hover: hover)`, so
    // touch screens don't get stuck hovers. It is deliberately not redefined
    // here: a plugin variant can't be composed, and overriding `hover`
    // silently removed every `group-hover:` and `peer-hover:` class. The
    // shared hover rules in tailwind/base.js add `(pointer: fine)` themselves.
    plugin(({ addBase }) => {
      addBase(iconStyles);
      addBase({ ":root": { ...darkTokens, ...specAliases }, ':root[data-theme="light"]': lightTokens });
      addBase(baseStyles);
    }),
  ],
};

export default config;
