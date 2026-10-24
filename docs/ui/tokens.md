# Tokens

Every visual value has a name. Use the class; never the raw value.
Source of truth: `tailwind/tokens.js` (CSS variables, per theme) and
`tailwind.config.js` (the Tailwind names for them).

## Colour

Theme colours switch with light and dark. In the config each is written as
`var(--token, light-dark(light, dark))`: the variable always wins at runtime
(a branded guideline section re-points it), and the literal is the readable
fallback, checked against `tokens.js` by `tailwind/colors.test.js`.

| Group | Classes (`bg-`, `text-`, `ring-`, …) | Use |
| --- | --- | --- |
| Grounds | `canvas`, `surface-0` … `surface-3` | Page, cards, wells; each step one up |
| Text | `text`, `text-secondary`, `text-muted`, `text-faint` | Strongest to weakest; `text-faint` only on plain surfaces |
| Accent | `accent`, `accent-soft`, `accent-text`, `accent-on-soft`, `accent-ink`, `accent-ring`, `accent-edge` | `accent-text` for links/labels, `accent-ink` on a solid accent fill |
| Solid pill | `solid`, `solid-ink` | The primary button: opposite of the ground |
| Edges | `hairline`, `hairline-strong`, `chip-edge` | Lines, drawn as inset rings, never borders |
| Status | `success`, `warning`, `danger`, `*-soft`, `status-ink`, `danger-ink` | Status text, badge tints, text on a solid status fill |
| Overlay | `scrim`, `scrim-ink` | Behind a modal |

Static palettes, the same in both themes: `brand-50` … `brand-950`
(`brand` = `#5E81F4`, `brand-deep` = `#1B51E5`, `brand-ink`, `brand-grey`)
and `secondary-indigo|cyan|red|green|yellow|violet`.

Contrast is enforced by `npm run audit:contrast`: 4.5:1 for body text, 7:1
for 10–11px text, in both themes.

## Type

| Class | Size | Use |
| --- | --- | --- |
| `text-ui-3xs` | 9px | Segmented control at its smallest |
| `text-ui-2xs` | 11px | Captions, table headers, badges |
| `text-ui-xs` | 12px | Field labels, hints, notes |
| `text-ui-sm` | 12.5px | Banner and helper copy |
| `text-ui` | 13px | Default control and body text |
| `text-ui-plus` | 13.5px | Dialog body |
| `text-ui-md` | 14px | Larger body, editors |
| `text-ui-lg` | 15px | Inputs, section titles |
| `text-title-sm` | 18px | Dialog title |
| `text-title` | 22px | Stat values |
| `text-display` | 32px | Page title |

All of these keep a 1.5 line height. Also: `leading-prose` (1.6, body copy in
dialogs), `tracking-caps` (0.06em) and `tracking-caps-wide` (0.08em) for small
uppercase labels. Fonts: `font-sans`, `font-display`, `font-arabic`, `font-mono`.
Tailwind's own `text-xs` … `text-9xl` are also available.

## Radius

Tailwind's own scale only: `rounded-lg` (8px, fields and small boxes),
`rounded-xl` (12px, panels inside cards), `rounded-2xl` (16px, cards and
modals), `rounded-full` (buttons, pills, chips, avatars). There are no custom
radius names; an in-between value snaps to the nearest step.

## Shadow

| Class | Use |
| --- | --- |
| `shadow-edge` | The standard 1px inset edge (`hairline-strong`) |
| `shadow-edge-soft` | A quieter edge (`hairline`) |
| `shadow-edge-accent` | An edge in the accent, e.g. a selected item |
| `shadow-edge-success`, `shadow-edge-danger` | Toasts, a typed confirmation that matches |
| `shadow-edge-editing` | A rich-text editor while it is open |
| `shadow-edge-pop`, `shadow-edge-modal` | Popover and modal: edge plus elevation |
| `shadow-soft` | The lift under a hovered button |
| `shadow-pop`, `shadow-modal` | Elevation alone |
| `shadow-rule-b`, `shadow-rule-t` | A 1px rule under a header or over a footer |

## Z-index

From the page up: `z-sticky` (40, page chrome that stays on scroll),
`z-dropdown` and `z-modal` (50), `z-toast` (100), `z-dialog` (120, the
confirm dialog, above everything). Stacking inside one component stays
numeric (`z-10`, `z-20`).

## Motion

| Token | Class | Value | Use |
| --- | --- | --- | --- |
| `--duration-fast` | `duration-fast` | 150ms | Hover, press, colour changes, every exit |
| `--duration-base` | `duration-base` | 250ms | Dropdowns, tabs, accordions, toasts |
| `--duration-slow` | `duration-slow` | 400ms | Pages, modals, drawers |
| `--ease-out` | `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entering |
| `--ease-in` | `ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` | Leaving |
| `--ease-in-out` | `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Moving or resizing in place |

Animations built on them are listed in [motion.md](motion.md).

## Breakpoints

Tailwind's own: `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536, plus
`3xl` 1600 and `4xl` 1850. For "below a size" use `max-md:` and friends.
Under 900px the sidebar collapses to its icon rail on its own.
