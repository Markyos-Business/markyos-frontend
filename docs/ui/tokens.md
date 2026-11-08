# Tokens

Every visual value has a name. Use the class; never the raw value.
The values come from [MARKYOS_UI.md](../MARKYOS_UI.md) §2. In code, the
source of truth is `tailwind/tokens.js` (CSS variables, per theme) and
`tailwind.config.js` (the Tailwind names for them). The spec's own variable
names (`--primary`, `--surface-card`, `--text-body`, `--ink-35`…) are defined
too, as aliases, so markup copied from the spec works in both themes.

## Colour

Theme colours switch with light and dark. The dark values are the spec's;
the light ones are derived role for role and contrast-checked. In the config
each is written as `var(--token, light-dark(light, dark))`: the variable
always wins at runtime (a branded guideline section re-points it), and the
literal is the readable fallback, checked against `tokens.js` by
`tailwind/colors.test.js`.

| Group | Classes (`bg-`, `text-`, …) | Dark value | Use |
| --- | --- | --- | --- |
| Grounds | `canvas`, `surface-0`/`surface-1`, `surface-2`, `surface-3` | #000, #111, #1A1A1A, #242424 | Page; cards and panels; raised fills (inputs, table heads, resting tabs); one step above |
| | `surface-highlight`, `surface-sunken` | #161616, white 4% | Unread or highlighted row; widget rows and sunken areas |
| Text | `text`, `text-secondary`, `text-muted`, `text-faint` | white, then the spec's 80 / 60% ladder | Heading, body, secondary, captions |
| | `text-disabled` | white 40% | Placeholders and disabled labels only |
| Accent | `accent`, `accent-deep`, `accent-soft` | #0099FF, #0055FF, 14% tint | The one accent; pressed; its tint |
| | `accent-text`, `accent-on-soft`, `accent-ink` | | Accent as text; text on the tint; text on a solid accent |
| | `accent-ring`, `accent-edge` | | Focus ring; selected edge |
| Edges | `hairline`, `hairline-strong`, `line-strong` | white 5 / 10 / 20% | Dividers; card edges (inset, never a border); an input's resting underline |
| Status | `success`, `warning`, `info`, `danger`, `attention` | #00DE68, #FFBB00, #00CCFF, red lifted to 7:1, orange | Status only, as text |
| | `danger-fill` | #FF0066 | The spec's red as a fill: dots, bars, solid badges |
| | `*-soft` | each hue at 14% | Badge and tag tints |
| | `status-ink`, `danger-ink` | | Text on a solid status fill |
| Neutral | `ink-soft`, `track` | white 10%, #333 | Outline button and progress track; a switch's off track |
| Inverted | `solid`, `solid-ink` | white, black | The tooltip; the opposite of the ground |
| Overlay | `scrim`, `scrim-ink` | | Behind a modal |

Static palettes, the same in both themes: `brand-50` … `brand-950`
(`brand` = `#0099FF`, `brand-deep` = `#0055FF`) for the logo and marketing,
and `secondary-indigo|indigo-ink|cyan|cyan-alt|red|green|green-light|yellow|violet`
for charts only. Chart series order: accent, green, yellow, red, cyan, indigo.

Contrast is enforced by `npm run audit:contrast`: 4.5:1 for body text, 7:1
for small text, in both themes. Where the spec's value is under that floor
as text, the text token is the same hue lifted until it passes (`danger`,
the text ramp) and the spec's value stays for fills (`danger-fill`).

## Type

The product is Inter at weights 400 and 500 only: 400 for body and captions,
500 for every heading, value, label and button. `font-semibold` and
`font-bold` are pinned to 500 in the config so nothing renders heavier; write
`font-medium`.

| Class | Size / line | Use |
| --- | --- | --- |
| `text-h1` | 32 / 48 | Page title |
| `text-h2` | 26 / 40 | Large values |
| `text-h3` | 20 / 32 | Section heading |
| `text-h4` | 18 / 27 | Dialog title |
| `text-h5` | 16 / 24 | Card and panel titles |
| `text-body` | 14 / 21 | Body, controls, buttons |
| `text-caption` | 12 / 18 | Field titles, hints, meta (the spec's "secondary") |
| `text-overline` + `uppercase` | 12 / 1, 500 | The only caps: tab labels, SORT:, PREV, NEXT, VIEW ALL |

Fonts: `font-sans` and `font-display` (both Inter, Arabic falling through to
IBM Plex Sans Arabic), `font-brand` (Bricolage Grotesque: wordmark and
marketing only, never product chrome), `font-arabic`, `font-mono`. The older
`text-ui-*` and `text-title*` sizes are still defined for screens not yet
moved to the scale above.

## Spacing and fixed sizes

The spec's spacing is measured, not a 4/8 grid; don't round it.

| Class suffix | px |
| --- | --- |
| `space-1` … `space-11` | 4, 5, 8, 10, 14, 18, 19, 25, 26, 32, 40 |

Card padding is `p-space-10` on view cards and `p-space-8` on widgets; rows
pad `px-space-6`. Tailwind's numeric scale is still there.

Fixed component sizes, for `h-`, `w-`, `size-`, `min-h-`:

| Class suffix | px | What |
| --- | --- | --- |
| `control` | 46 | Buttons and icon buttons |
| `control-sm` | 40 | Tabs, pagination cells, compact buttons |
| `field` | 72 | A text field block: title, value, underline |
| `tag` / `status-tag` / `badge` | 36 / 28 / 24 | Tag, status tag, badge |
| `widget-row` | 72 | Rows in widgets and tables |
| `rail` / `rail-item` / `rail-item-box` / `topbar` | 84 / 64 / 48 / 84 | App shell |

## Radius

Radius encodes size class: pick it by component.

| Class | px | Components |
| --- | --- | --- |
| `rounded-sm` | 4 | Checkbox, rail tile, chip |
| `rounded-md` | 6 | Pagination cell, status tag |
| `rounded-lg` | 8 | Buttons, tags, icon tiles |
| `rounded-spark` | 10 | Spark counter |
| `rounded-switch` | 12 | Switch |
| `rounded-card`, `rounded-widget` | 15 | Cards, counters, menus, dialogs, widget rows |
| `rounded-feature` | 25 | Marketing feature cards |
| `rounded-full` | | Radio, presence dots, avatars |

## Shadow and light

Borders are inset shadows; cards get no drop shadow.

| Class | Use |
| --- | --- |
| `shadow-edge` | The card edge: 1px inset `hairline-strong` |
| `shadow-edge-soft` | A quieter edge (`hairline`) |
| `shadow-edge-primary`, `shadow-edge-accent` | An edge in the accent, full or soft: active, selected |
| `shadow-edge-success`, `shadow-edge-danger` | Toasts, a typed confirmation that matches |
| `shadow-edge-pop`, `shadow-edge-modal` | Menus and dialogs: the edge plus `shadow-raised` |
| `shadow-raised` (`shadow-pop`, `shadow-modal`) | The one elevation, for menus and overlays only |
| `shadow-glow`, `shadow-glow-soft` | Light, for active, focus and highlight only, about 2% of a layout |
| `drop-shadow-glow` | A glowing chart line |
| `shadow-ring-status` | A presence dot's halo |
| `shadow-rule-b`, `shadow-rule-t` | A 1px rule under a header or over a footer |

## Z-index

From the page up: `z-sticky` (40, page chrome that stays on scroll),
`z-dropdown` and `z-modal` (50), `z-toast` (100), `z-dialog` (120, the
confirm dialog, above everything). Stacking inside one component stays
numeric (`z-10`, `z-20`).

## Motion

| Token | Class | Value | Use |
| --- | --- | --- | --- |
| `--duration-fast` | `duration-fast` (the default) | 120ms | Colour, opacity and shadow |
| `--duration-base` | `duration-base` | 180ms | Switch knobs and progress fills only |
| `--ease-standard` | `ease-standard` (the default) | `cubic-bezier(.4,0,.2,1)` | Everything |
| `--hover-scrim` | `mk-btn` | black 35% on dark | Hover and press on buttons |

Animations: `animate-fade-in`, `animate-fade-out`, `animate-shimmer`,
`animate-spin-quick`. See [motion.md](motion.md).

## Breakpoints

Tailwind's own: `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536, plus
`3xl` 1600 and `4xl` 1850. For "below a size" use `max-md:` and friends.
Under 900px the sidebar collapses to its icon rail on its own.
