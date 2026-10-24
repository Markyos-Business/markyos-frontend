# Markyos UI

How the Markyos frontend is styled and built: the tokens, the shared
components, how things move, and the rules every new component follows.

The design itself is specified in [MARKYOS_UI.md](../MARKYOS_UI.md), the
Markyos Design System export: its values and hard rules are the source of
truth, and these pages say how they map onto the code. Two deliberate
differences: the app keeps a light theme, derived from the spec's dark
values, and where a spec colour is under the contrast floor as text, the text
token is the same hue lifted (the spec's value stays for fills).

| Read | For |
| --- | --- |
| [tokens.md](tokens.md) | Colours, type, radii, shadows, z-index, motion and breakpoints, and the class for each |
| [components.md](components.md) | Every shared component and hook: where it lives, its props, a usage example |
| [motion.md](motion.md) | The motion system: what moves, how fast, and the rules |
| [conventions.md](conventions.md) | Folder layout, code style, and the checklist before a component is done |

## Where styling lives

There is no global stylesheet. All styling is Tailwind utilities in JSX,
backed by one config:

```
src/app/tailwind.css      the only CSS entry: loads Tailwind and the config
tailwind.config.js        the theme: colours, type, radii, shadows, z-index, motion
tailwind/tokens.js        design tokens as CSS variables, dark (default) and light
tailwind/base.js          element defaults and shared rules (focus, rich text, motion)
tailwind/icons.js         the icon set, drawn as CSS masks
tailwind/colors.test.js   fails if a config colour drifts from its token
```

Add a new value to `tailwind.config.js` (or a token to `tailwind/tokens.js`)
rather than writing a pixel value in a component. If a class you need does
not exist, the design is missing a token: add it once and name it.

## Light and dark

The app has both themes. `data-theme` on `<html>` (set by the theme toggle)
switches every token, so a component written with token classes
(`bg-surface-1`, `text-text-muted`) works in both without `dark:` variants.
The fixed `brand-*` and `secondary-*` palettes are the same in both themes and
are for marketing, charts and illustrations only.

## Checks that guard this

```bash
npm run audit:contrast   # every text token on every ground, both themes
npm run audit:tokens     # guideline templates get every --g-* token they use
npm run audit:logical    # no physical left/right; layouts mirror in Arabic
npm run audit:icons      # every icon a component asks for is drawn
npx vitest run           # includes the colour drift test
```
