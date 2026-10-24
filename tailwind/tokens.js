/**
 * Markyos design tokens, as CSS custom properties.
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
   * The Arabic face sits in the display chain on purpose: Bricolage carries no
   * Arabic glyphs, so without it every Arabic heading fell through to a generic
   * system sans instead of the matched-weight Arabic type. Font fallback is
   * per-character, so Latin still renders in Bricolage.
   */
  "--font-display": "var(--font-bricolage), var(--font-plex-arabic), \"Inter\", var(--font-inter), sans-serif",
  "--font-sans": "var(--font-inter), \"Inter\", system-ui, sans-serif",
  "--font-arabic": "var(--font-plex-arabic), var(--font-inter), sans-serif",
  "--font-mono": "ui-monospace, Menlo, monospace",
  /*
   * The surface ramp.
   *
   * Deepened at the bottom and lifted in the middle, which is as far as a *fill*
   * can go here. A card at #141414 on a #090909 canvas measured **1.06:1** — the
   * card was not subtle, it was absent, and a page of them read as one dark slab
   * with no objects on it. Widening the gap gets it to 1.12:1 and no further:
   * near black, a large luminance step is a small ratio, and the step cannot be
   * widened without lightening the deepest card the text ramp is solved against.
   *
   * That is why every dark interface of this kind draws a border and not a
   * brighter fill, and why `--hairline-strong` below is the real answer. This
   * ramp's job is to keep the ordering legible; the edge's job is to say where
   * one surface stops.
   */
  "--canvas": "#060607",
  "--surface-0": "#0c0c0e",
  "--surface-1": "#16161a",
  "--surface-2": "#1e1e22",
  /* A step under the old #252525 rather than over it: `--text-faint` is solved
  against this surface at exactly 7:1, and lifting the deepest card in the
  theme is the one change that would quietly drop the whole small-type floor
  back under the bar. */
  "--surface-3": "#232326",
  "--accent": "#0099ff",
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
   */
  "--text": "#ffffff",
  "--text-secondary": "#e4e4e9",
  "--text-muted": "#ccccd2",
  "--text-faint": "#afafb6",
  /* Same rule as the light theme's, lifted rather than deepened. */
  "--success": "#7ce7ac",
  "--warning": "#f4be5e",
  "--danger": "#ffa8b0",
  /* Tinted fills behind a status badge's text. */
  "--success-soft": "rgba(124, 231, 172, 0.14)",
  "--warning-soft": "rgba(244, 190, 94, 0.14)",
  "--danger-soft": "rgba(255, 128, 139, 0.14)",
  /*
   * The ink to put ON a filled accent/status surface.
   *
   * White was hard-coded at every one of these call sites, which is 3.0:1 on
   * this theme's accent and 2.4:1 on its danger — both illegible, both on
   * buttons carrying the primary action. On a bright accent the legible ink is
   * dark, and on a deep one it's white, so which one it is has to be a token
   * the theme answers rather than a literal in the markup.
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
   * another begins. It was 0.12, which composites to a 1.4:1 line, and the cards
   * that carried it were the lucky ones — most had no edge at all and sat on a
   * canvas 1.06:1 away from them. It is now solved so the composite clears
   * **1.5:1 against the card it bounds and against the ground it sits on**,
   * in both themes, and `contrast-audit.mjs` holds it there. That is below the
   * 3:1 WCAG 1.4.11 asks of a control's boundary and deliberately so — a card is
   * not a control, and an edge that loud turns a grid of files into a cage.
   */
  "--hairline": "rgba(255, 255, 255, 0.07)",
  "--hairline-strong": "rgba(255, 255, 255, 0.16)",
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
   * Each theme now states its own: dark leans on the hairline and a short
   * shadow, because here elevation is read from the surface getting *lighter*.
   */
  "--shadow-pop": "0 10px 28px rgba(0, 0, 0, 0.42)",
  "--shadow-modal": "0 24px 60px rgba(0, 0, 0, 0.55)",
  /*
   * How a native control shifts when pointed at. The hover veil handles
   * everything else by tinting toward `currentColor`, which needs no per-theme
   * value; a `<select>` cannot take the veil (it would disturb the dropdown
   * arrow) and so needs a direction stated: lift on dark, settle on light.
   */
  "--hover-shift": "brightness(1.28)",
  "--chrome-mark-invert": "invert(1)",
  "color-scheme": "dark",
};

/*
 * Light theme. Every surface steps up instead of down, and the semantic
 * colours are re-picked rather than lightened: the dark theme's pastel
 * success/warning/danger have far too little contrast on white to carry
 * meaning, which is the one thing those colours exist to do.
 */
export const lightTokens = {
  /* The ground is deliberately a step greyer than the cards: most surfaces in
   * this app are drawn as a fill with no border, so on a white-on-white pair
   * every panel edge would vanish. */
  "--canvas": "#eeeef2",
  "--surface-0": "#ffffff",
  "--surface-1": "#ffffff",
  "--surface-2": "#f0f0f4",
  "--surface-3": "#e4e4ea",
  /* Each of these was solved against `--surface-3` (#e4e4ea), the greyest
   * ground in the light theme. The previous values were picked against white
   * and dropped to 3.7–4.1:1 the moment they were used on a tinted card.
   *
   * #0068b8 then failed a ground `--surface-3` doesn't cover: a selected chip
   * sets its own `--accent-soft` fill and labels it in `--accent`, which put
   * the accent on a blue-tinted ground rather than a grey one and landed at
   * 4.31:1 — the Visual identity filter chips, the Builder's page tabs, every
   * selected pill in the product. Solved against that tint instead. */
  "--accent": "#0062b8",
  "--accent-soft": "rgba(0, 98, 184, 0.1)",
  "--accent-ring": "rgba(0, 98, 184, 0.22)",
  /* Same job as the dark theme's, solved the other way: on light the tint
   * darkens its ground, so the ink has to go deeper rather than brighter. */
  "--accent-on-soft": "#004080",
  /* The text accent, mirrored — deeper rather than brighter. */
  "--accent-text": "#00478f",
  /* The same 7 / 9.5 / 12 / 15 ramp as the dark theme, mirrored. */
  "--text": "#0d0d0f",
  "--text-secondary": "#262629",
  "--text-muted": "#36363c",
  "--text-faint": "#47474f",
  /* Deepened to clear 7:1 at the 10–11px these are almost always set at — a
  "Verified" chip and an "AAA" badge are small type, not headings. */
  "--success": "#085230",
  "--warning": "#654000",
  "--danger": "#8a1824",
  /* Each a tint of this theme's status colour, so the badge text keeps its
   * contrast; the dark theme's tints are too pale behind these inks. */
  "--success-soft": "rgba(8, 82, 48, 0.08)",
  "--warning-soft": "rgba(101, 64, 0, 0.08)",
  "--danger-soft": "rgba(138, 24, 36, 0.08)",
  /* Here the accent is deep, so the legible ink on it is white. */
  "--accent-ink": "#ffffff",
  "--status-ink": "#ffffff",
  "--danger-ink": "#ffffff",
  /* Same two jobs, mirrored — see the note in the dark block. The card edge is
  deeper here than the ratio alone suggests, because a white card on a #eeeef2
  canvas has nothing else separating it: on the dark theme the fill step does
  a little of the work, and on this one it does almost none. */
  "--hairline": "rgba(9, 9, 11, 0.09)",
  "--hairline-strong": "rgba(9, 9, 11, 0.22)",
  "--accent-edge": "rgba(0, 98, 184, 0.55)",
  /* Chip edge and scrim are intentionally identical to the dark theme's — see
   * the note there; both are about the content, not the interface. */
  "--chip-edge": "rgba(130, 130, 138, 0.5)",
  "--scrim": "rgba(9, 9, 9, 0.62)",
  "--scrim-ink": "#ffffff",
  /* Darker than the dark theme's thumb, for the same 3:1 reason. #83838a
  measured 2.97:1 against `--surface-3` — right idea, one step short. */
  "--scrollbar-thumb": "#7d7d84",
  "--scrollbar-thumb-hover": "#63636a",
  /* Lighter and wider than the dark theme's. On a light ground the shadow is
  the whole of the elevation signal, so it has to be soft enough not to look
  like a bruise and wide enough to read as height rather than as an edge. */
  "--shadow-pop": "0 8px 24px rgba(16, 16, 24, 0.14), 0 2px 6px rgba(16, 16, 24, 0.08)",
  "--shadow-modal": "0 20px 50px rgba(16, 16, 24, 0.2), 0 4px 12px rgba(16, 16, 24, 0.1)",
  /* Settle rather than lift: on a light ground a control gets darker when
  pointed at, and `brightness` above 1 on a white control does nothing. */
  "--hover-shift": "brightness(0.95)",
  "--solid": "#101014",
  "--solid-ink": "#ffffff",
  "--chrome-mark-invert": "none",
  "color-scheme": "light",
};
