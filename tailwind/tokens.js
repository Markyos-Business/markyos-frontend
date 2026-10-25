/**
 * Markyos design tokens, as CSS custom properties.
 *
 * The values come from docs/MARKYOS_UI.md (the Markyos Design System export),
 * which is the source of truth: its dark values are the dark theme here, and
 * the light theme is derived from them role for role. The existing names
 * (`--surface-1`, `--text-muted`, `--accent`…) are kept because the whole app
 * is written against them; the spec's own names (`--surface-card`,
 * `--text-body`, `--primary`…) are aliases of them at the end of each block.
 *
 * The dark theme is the default on :root; the light theme overrides it under
 * [data-theme="light"], which the theme toggle sets on <html>. Every colour,
 * font and radius utility in tailwind.config.js points at one of these, so
 * switching the attribute repaints the whole app. The contrast audit reads
 * these objects directly (scripts/contrast-audit.mjs).
 */

/** Dark theme, the default. Also holds the type stacks, the same in both. */
export const darkTokens = {
  /*
   * Type stacks, the same in both themes.
   *
   * The product UI is Inter everywhere, headings included (spec §3). Bricolage
   * Grotesque is the brand face, for the wordmark and marketing only, never
   * product chrome; it is `--font-brand`. `--font-display` stays as a name
   * because a hundred headings use it, and now means the product heading
   * stack. Arabic falls through to IBM Plex Sans Arabic: the spec names
   * Thmanya Sans, whose files are not in the repo yet.
   */
  "--font-display": "var(--font-inter), \"Inter\", var(--font-plex-arabic), system-ui, sans-serif",
  "--font-sans": "var(--font-inter), \"Inter\", var(--font-plex-arabic), system-ui, sans-serif",
  "--font-brand": "var(--font-bricolage), var(--font-plex-arabic), \"Inter\", var(--font-inter), sans-serif",
  "--font-arabic": "var(--font-plex-arabic), var(--font-inter), sans-serif",
  "--font-mono": "ui-monospace, Menlo, monospace",
  /* Inter's alternate glyphs the spec asks for. Arabic faces ignore them. */
  "--font-features": "\"cv01\", \"cv05\", \"cv09\", \"cv11\"",
  /*
   * The surface ramp (spec §2.3): a black canvas, #111 cards and panels,
   * #1A1A1A raised fills (inputs, table heads, resting tabs) and #242424 for
   * the one step above that. Flat: no gradients, no textures.
   *
   * Near black, a fill step is a small ratio (#111 on #000 is 1.1:1), so a
   * card is found by its edge, `--hairline-strong`, not by its fill.
   */
  "--canvas": "#000000",
  "--surface-0": "#111111",
  "--surface-1": "#111111",
  "--surface-2": "#1a1a1a",
  "--surface-3": "#242424",
  /* The unread or highlighted row (spec `--off-white`). */
  "--surface-highlight": "#161616",
  "--sidebar": "#000000",
  /* Widget rows and sunken areas: white at 4% over whatever is underneath. */
  "--surface-sunken": "rgba(255, 255, 255, 0.04)",
  "--accent": "#0099ff",
  /* Pressed, and where the glow falls off to. */
  "--accent-deep": "#0055ff",
  "--accent-soft": "rgba(0, 153, 255, 0.14)",
  "--accent-ring": "rgba(0, 153, 255, 0.18)",
  /*
   * The accent, as *text on its own tint*.
   *
   * A selected chip fills itself with `--accent-soft` and labels itself in
   * `--accent`, which is not the accent on a page — it's the accent on a
   * ground the accent has already lifted. That pairing measured 4.23:1, under
   * the floor, everywhere the pattern is used: the Builder's page tabs, the
   * Visual identity filters, every "on" toggle in the product.
   *
   * Solving it by thinning the tint would have fixed the number by making the
   * selected state harder to see, which is the wrong trade for a state
   * indicator. Solving it by moving `--accent` would have changed the brand
   * blue the design reference fixes at #0099ff. So the ink gets its own value,
   * for exactly the reason `--accent-ink` has one: which ink is legible
   * depends on what is underneath it.
   */
  "--accent-on-soft": "#85caff",
  /*
   * The accent, as text.
   *
   * `--accent` has two jobs that pull in opposite directions: it fills things
   * (a primary button, a progress bar, a selected pill) and it also inks small
   * text (a "+ Add", a "Copy", a clearspace measurement). A fill only has to be
   * the brand's blue. Text has to be *read* — and at the 10–12px these labels
   * are set at, #0099ff lands around 6.1:1, under the 7:1 this interface holds
   * small type to.
   *
   * Brightening `--accent` itself was not an option: it is a background in as
   * many places as it is a colour, `--accent-ink` is solved against it, and
   * moving it would have shifted every filled control in the product. So the
   * text case gets its own token, the way `--accent-on-soft` already handles
   * the tinted case. Same hue, lifted until it reads.
   *
   * Inside a brand's own guideline this is re-pointed at that brand's accent by
   * themeCssVars() and blockStyleCss(), exactly as `--accent` is — a studio's
   * blue stays the studio's blue.
   */
  "--accent-text": "#5cb9ff",
  /*
   * The text ramp.
   *
   * Every level is solved against `--surface-3`, the darkest ground any of
   * this is ever drawn on, at 7 / 9.5 / 12 / 15:1 — so a caption is legible on
   * the deepest card in the app, not only on the page behind it. The steps are
   * spaced apart rather than each sitting on a floor, because four levels that
   * all *just* pass are four levels nobody can tell apart, and the hierarchy
   * is the reason there are four.
   *
   * The bottom of the ramp used to be 4.6:1, and that was the mistake. 4.5:1
   * is WCAG's floor for *normal* text, and the standard means something around
   * 16px by that. Almost everything this level is actually used for — file
   * sizes, units, counters, field hints, the caption under a card — is set at
   * 10 or 11px, where the same ratio on half the stroke width is materially
   * harder to read. Measured on the Logo system screen, that was a page of
   * 5.1–6.0:1 labels: passing the letter of the rule and still too dim to read
   * comfortably, which is what kept getting reported.
   *
   * So the whole ramp moved up and the bottom of it now starts at 7:1 — AAA —
   * on the worst ground in the app. See `scripts/contrast-audit.mjs`, which
   * holds anything under 12.5px to that 7:1 bar rather than to 4.5:1.
   *
   * The same four ratios are used in the light theme, so the hierarchy reads
   * identically whichever way round the interface is.
   *
   * The spec's ladder is white at 100 / 80 / 60%, with 40% for placeholders
   * and disabled controls only. These are that ladder, neutral grey like the
   * spec's (no blue cast), each lifted just enough to hold the floors above on
   * `--surface-3`: white 60% is 6.3:1 there, under the 7:1 small-type bar.
   */
  "--text": "#ffffff",
  "--text-secondary": "#dbdbdb",
  "--text-muted": "#c4c4c4",
  "--text-faint": "#afafaf",
  /* Placeholders and disabled labels only: never anything that must be read. */
  "--text-disabled": "rgba(255, 255, 255, 0.4)",
  /*
   * Status (spec §2.3): green, yellow and red for status only, cyan for info.
   * The spec's red, #FF0066, is 4:1 as small text on a raised fill, so the
   * text tone is the same hue lifted to 7:1; `--danger-fill` is the spec's
   * own value, for dots, bars and anything that is colour rather than words.
   */
  "--success": "#00de68",
  "--warning": "#ffbb00",
  "--info": "#00ccff",
  /* Needs a look soon, short of a warning: the orange between warning and
   * danger that the status set uses for "attention". */
  "--attention": "#ffb37a",
  "--danger": "#ff8fb4",
  "--danger-fill": "#ff0066",
  /* The tint rule (spec §2.2): every soft fill is its hue at about 14%. */
  "--success-soft": "rgba(0, 222, 104, 0.14)",
  "--warning-soft": "rgba(255, 187, 0, 0.14)",
  "--danger-soft": "rgba(255, 0, 102, 0.14)",
  "--info-soft": "rgba(0, 204, 255, 0.14)",
  "--attention-soft": "rgba(255, 179, 122, 0.12)",
  /* A neutral soft fill: the outline button, a progress track. */
  "--ink-soft": "rgba(255, 255, 255, 0.1)",
  /*
   * The ink to put ON a filled accent/status surface.
   *
   * White was hard-coded at every one of these call sites, which is 3.0:1 on
   * this theme's accent and 2.4:1 on its danger — both illegible, both on
   * buttons carrying the primary action. On a bright accent the legible ink is
   * dark, and on a deep one it's white, so which one it is has to be a token
   * the theme answers rather than a literal in the markup.
   *
   * The spec's `--on-accent` is white. Kept dark here on purpose: white on
   * #0099FF is 3.0:1, under the 4.5:1 the spec's own definition of done asks
   * of text, on the label of the primary button.
   */
  "--accent-ink": "#0b0b0d",
  "--status-ink": "#0b0b0d",
  /*
   * Ink for something drawn on `--danger`, kept separate from `--status-ink`
   * on purpose: a brand theme overrides `--status-ink` with its *own* accent
   * ink (see themeCssVars), so a red badge rendered inside a guideline canvas
   * was picking up whatever polarity that brand's accent wanted — black on the
   * light theme's red, 3.68:1. This one no brand theme touches.
   */
  "--danger-ink": "#0b0b0d",
  /*
   * Two lines with two jobs, and only one of them is decoration.
   *
   * `--hairline` divides the inside of a surface — a row from the next row, a
   * thumbnail well from its caption. Both sides belong to the same object, so it
   * only has to be found when looked for.
   *
   * `--hairline-strong` is the **edge of a card**: where one surface stops and
   * another begins, drawn as an inset shadow, never a border (spec §1.4). The
   * spec draws it at white 10%, which composites to 1.3:1 on a #111 card and
   * 1.44:1 against the black canvas; `contrast-audit.mjs` holds it there. Well
   * below the 3:1 WCAG 1.4.11 asks of a control's boundary, deliberately — a
   * card is not a control, and an edge that loud turns a grid into a cage.
   *
   * `--line-strong` is the spec's `--border-strong`: the resting underline of
   * an input, the one real border in the system.
   */
  "--hairline": "rgba(255, 255, 255, 0.05)",
  "--hairline-strong": "rgba(255, 255, 255, 0.1)",
  "--line-strong": "rgba(255, 255, 255, 0.2)",
  /*
   * The ring around a selected card. Dozens of call sites wrote this as a
   * literal `rgba(0,153,255,.5)`, which froze the old accent into the markup —
   * so the light theme drew its selection rings in the dark theme's blue.
   */
  "--accent-edge": "rgba(0, 153, 255, 0.55)",
  /*
   * The edge on a colour chip.
   *
   * Deliberately a mid grey and the same in both themes, because what it has
   * to contrast with is the *swatch*, not the page: a palette holds #FFFFFF
   * and #000000, and any edge tied to the theme is invisible against one of
   * them. Mid grey is never the same as either end.
   */
  "--chip-edge": "rgba(130, 130, 138, 0.5)",
  /* A scrim laid over brand artwork, so it stays dark whichever theme is on —
   * the thumbnail underneath belongs to the brand, not to the interface. */
  "--scrim": "rgba(9, 9, 9, 0.62)",
  "--scrim-ink": "#ffffff",
  /*
   * How far to rotate monochrome artwork drawn as black-on-transparent so it
   * reads on this ground. The app's own marks are black SVGs, so they need
   * reversing on the dark theme and must be left alone on the light one.
   * Uploaded brand artwork does NOT use this — see components/BrandMark.tsx,
   * which measures each file instead of assuming.
   */
  /*
   * The high-contrast "solid" button — the one primary action on a screen.
   * It is defined as a token because it is the *opposite* of the ground, not
   * a fixed white: a white pill reads as the primary action on the dark
   * theme and disappears against the light one.
   */
  "--solid": "#ffffff",
  "--solid-ink": "#090909",
  /*
   * The scrollbar thumb, with a value of its own.
   *
   * It used to be `--surface-3` — a *surface* token, borrowed for a control.
   * On the light theme that was #e4e4ea on a #eeeef2 canvas: 1.1:1, which is
   * not a subtle scrollbar but an absent one, on the element that says there is
   * more to read and offers something to grab. Solved at 3:1 against the worst
   * ground it is drawn on, which is WCAG 1.4.11's floor for a control that
   * carries meaning. `scripts/contrast-audit.mjs` holds it there.
   */
  "--scrollbar-thumb": "#6e6e75",
  "--scrollbar-thumb-hover": "#8c8c95",
  /*
   * Elevation.
   *
   * A shadow is light that did not arrive, so it only reads on a surface bright
   * enough to have had some. Every floating surface in this app was written as
   * `rgba(0,0,0,.35)` or heavier — tuned by eye on this theme, where a black
   * shadow on a near-black canvas does almost nothing, then carried unchanged
   * onto the light theme where the same value is a bruise under every menu.
   * Each theme states its own. On dark, depth comes from light, not shadow
   * (spec §1.5): cards have no drop shadow at all, and the one shadow,
   * `--shadow-raised`, is for menus and overlays only. `--shadow-pop` and
   * `--shadow-modal` are the names the app already uses for exactly those.
   */
  "--shadow-raised": "0 20px 40px rgba(0, 0, 0, 0.6)",
  "--shadow-pop": "0 20px 40px rgba(0, 0, 0, 0.6)",
  "--shadow-modal": "0 20px 40px rgba(0, 0, 0, 0.6)",
  "--shadow-soft": "0 0 0 1px rgba(255, 255, 255, 0.08)",
  /*
   * Light, for active, focus and highlight only, on about 2% of a layout.
   * `--glow-line` is a `filter` for chart lines, not a shadow.
   */
  "--glow-primary": "0 0 6px #0099ff, 0 0 24px rgba(0, 153, 255, 0.6), 0 0 64px rgba(0, 85, 255, 0.4)",
  "--glow-soft": "0 0 18px rgba(0, 153, 255, 0.35)",
  "--glow-line": "drop-shadow(0 0 6px rgba(0, 153, 255, 0.8)) drop-shadow(0 0 18px rgba(0, 85, 255, 0.5))",
  /*
   * Motion (spec §1.8), the same in both themes, and minimal: 120ms
   * crossfades for colour, opacity and shadow, 180ms for switch knobs and
   * progress fills, all on one curve. No bounce, spring, entrance animation
   * or parallax.
   */
  "--duration-fast": "120ms",
  "--duration-base": "180ms",
  "--ease-standard": "cubic-bezier(0.4, 0, 0.2, 1)",
  /*
   * Hover and press (spec §1.6): one scrim over the resting fill, the same
   * for every button. No lift, no scale, no darker hex. Black at 35% on
   * dark; the light theme states a lighter one.
   */
  "--hover-scrim": "rgba(0, 0, 0, 0.35)",
  /*
   * How a native control shifts when pointed at. The hover veil handles
   * everything else by tinting toward `currentColor`, which needs no per-theme
   * value; a `<select>` cannot take the veil (it would disturb the dropdown
   * arrow) and so needs a direction stated: lift on dark, settle on light.
   */
  "--hover-shift": "brightness(1.28)",
  /* The off track of a switch (spec `--grey-400`). */
  "--track": "#333333",
  "--chrome-mark-invert": "invert(1)",
  "color-scheme": "dark",
};

/*
 * The spec's own names (docs/MARKYOS_UI.md §2), as aliases of the tokens
 * above, so markup or inline styles written straight from the spec work and
 * follow the theme. Declared once on :root: each resolves against whichever
 * theme is active. Prefer the Tailwind classes in components.
 */
export const specAliases = {
  "--brand-black": "#000000",
  "--brand-white": "#ffffff",
  "--brand-blue": "#0099ff",
  "--brand-blue-deep": "#0055ff",
  "--primary": "var(--accent)",
  "--primary-deep": "var(--accent-deep)",
  "--primary-10": "var(--accent-soft)",
  "--on-accent": "var(--accent-ink)",
  "--surface-page": "var(--canvas)",
  "--surface-card": "var(--surface-1)",
  "--surface-panel": "var(--surface-1)",
  "--bg-light": "var(--surface-2)",
  "--off-white": "var(--surface-highlight)",
  "--text-heading": "var(--text)",
  "--text-body": "var(--text-secondary)",
  "--text-link": "var(--accent-text)",
  "--text-40": "var(--text-disabled)",
  "--border-subtle": "var(--hairline)",
  "--border-default": "var(--hairline-strong)",
  "--border-strong": "var(--line-strong)",
  "--border-focus": "var(--accent)",
  "--ink-10": "var(--ink-soft)",
  "--ink-35": "var(--hover-scrim)",
  "--grey-400": "var(--track)",
  "--status-success": "var(--success)",
  "--status-warning": "var(--warning)",
  "--status-danger": "var(--danger)",
  "--status-info": "var(--info)",
  "--green-10": "var(--success-soft)",
  "--yellow-10": "var(--warning-soft)",
  "--red-10": "var(--danger-soft)",
  "--cyan-10": "var(--info-soft)",
  "--transition-state":
    "background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard)",
};

/*
 * Light theme. Every surface steps up instead of down, and the semantic
 * colours are re-picked rather than lightened: the dark theme's pastel
 * success/warning/danger have far too little contrast on white to carry
 * meaning, which is the one thing those colours exist to do.
 */
export const lightTokens = {
  /* White page and white cards, told apart by the #e5e5e5 hairline. Neutral
   * greys throughout: blue is kept for actions, focus and data. */
  "--canvas": "#ffffff",
  "--surface-0": "#ffffff",
  "--surface-1": "#ffffff",
  "--surface-2": "#f5f5f5",
  "--surface-3": "#ededed",
  "--surface-highlight": "#fafafa",
  /* The sidebar sits a shade off the white page, so the two read apart. */
  "--sidebar": "#fafafa",
  "--surface-sunken": "rgba(10, 10, 10, 0.03)",
  /* The deep brand blue. 5.2:1 on #f5f5f5 and 4.8:1 on its own #e6eeff tint,
   * so it can label a selected chip as well as fill a button. */
  "--accent": "#0055ff",
  "--accent-deep": "#0044cc",
  "--accent-soft": "#e6eeff",
  "--accent-ring": "rgba(0, 85, 255, 0.22)",
  /* Same job as the dark theme's, solved the other way: on light the tint
   * darkens its ground, so the ink has to go deeper rather than brighter. */
  "--accent-on-soft": "#0055ff",
  /* The text accent, mirrored — deeper rather than brighter. */
  "--accent-text": "#0055ff",
  /* The same 7 / 9.5 / 12 / 15 ramp as the dark theme, mirrored. */
  "--text": "#0a0a0a",
  "--text-secondary": "#171717",
  "--text-muted": "#6b6b6b",
  "--text-faint": "#6b6b6b",
  "--text-disabled": "rgba(10, 10, 10, 0.4)",
  /* Status inks are the text shades: #009966 and #d08700 fall under 4.5:1 as
   * text on grey, so text uses these deeper tones and the brighter ones are
   * left to charts. */
  "--success": "#007a52",
  "--warning": "#8a5c00",
  "--attention": "#7a3400",
  "--danger": "#c80009",
  "--danger-fill": "#e7000b",
  /* The spec's cyan, deepened the same way, to 7:1 on `--surface-3`. */
  "--info": "#004a5f",
  /* Each a tint of this theme's status colour, so the badge text keeps its
   * contrast; the dark theme's tints are too pale behind these inks. */
  "--success-soft": "#e6f5ef",
  "--warning-soft": "#fbf3e6",
  "--danger-soft": "#fdecec",
  "--attention-soft": "rgba(122, 52, 0, 0.07)",
  "--info-soft": "rgba(0, 74, 95, 0.08)",
  "--ink-soft": "rgba(10, 10, 10, 0.06)",
  /* Here the accent is deep, so the legible ink on it is white. */
  "--accent-ink": "#ffffff",
  "--status-ink": "#ffffff",
  "--danger-ink": "#ffffff",
  /* Same two jobs, mirrored — see the note in the dark block. The card edge is
  deeper here than the ratio alone suggests, because a white card on a #eeeef2
  canvas has nothing else separating it: on the dark theme the fill step does
  a little of the work, and on this one it does almost none. */
  "--hairline": "#e5e5e5",
  "--hairline-strong": "rgba(10, 10, 10, 0.106)",
  "--line-strong": "rgba(10, 10, 10, 0.32)",
  "--accent-edge": "rgba(0, 85, 255, 0.55)",
  /* Chip edge and scrim are intentionally identical to the dark theme's — see
   * the note there; both are about the content, not the interface. */
  "--chip-edge": "rgba(130, 130, 138, 0.5)",
  "--scrim": "rgba(9, 9, 9, 0.62)",
  "--scrim-ink": "#ffffff",
  /* Darker than the dark theme's thumb, for the same 3:1 reason. #83838a
  measured 2.97:1 against `--surface-3` — right idea, one step short. */
  "--scrollbar-thumb": "#7d7d7d",
  "--scrollbar-thumb-hover": "#636363",
  /* Lighter and wider than the dark theme's. On a light ground the shadow is
  the whole of the elevation signal, so it has to be soft enough not to look
  like a bruise and wide enough to read as height rather than as an edge. */
  "--shadow-pop": "0 8px 24px rgba(10, 10, 10, 0.12), 0 2px 6px rgba(10, 10, 10, 0.06)",
  "--shadow-modal": "0 20px 50px rgba(10, 10, 10, 0.18), 0 4px 12px rgba(10, 10, 10, 0.08)",
  "--shadow-soft": "0 0 0 1px #e5e5e5",
  "--shadow-raised": "0 8px 24px rgba(10, 10, 10, 0.12), 0 2px 6px rgba(10, 10, 10, 0.06)",
  /* Glow does not read on a light ground, so the same roles are a tighter
  halo in the deeper accent. */
  "--glow-primary": "0 0 0 1px rgba(0, 85, 255, 0.5), 0 0 16px rgba(0, 85, 255, 0.3)",
  "--glow-soft": "0 0 12px rgba(0, 85, 255, 0.28)",
  "--glow-line": "drop-shadow(0 0 4px rgba(0, 85, 255, 0.4))",
  /* A black scrim at the dark theme's 35% turns a white button grey; this is
  the same darkening, at the strength a light ground needs. */
  "--hover-scrim": "rgba(0, 0, 0, 0.1)",
  "--track": "#bdbdbd",
  /* Settle rather than lift: on a light ground a control gets darker when
  pointed at, and `brightness` above 1 on a white control does nothing. */
  "--hover-shift": "brightness(0.95)",
  "--solid": "#0a0a0a",
  "--solid-ink": "#ffffff",
  "--chrome-mark-invert": "none",
  "color-scheme": "light",
};
