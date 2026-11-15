# Button family verification — 14 November 2026

Implemented all 17 requested components under `src/components/ui/button/`, plus
`useAsyncButton`. Existing UI barrel imports, legacy variants, `href`, IconButton
props, and CopyButton props remain supported. Components are registered as wave 2,
`in-review`; `npm run status` generates 70 entries.

The gallery is `/design-system#buttons`, enabled by `NEXT_PUBLIC_UI_GALLERY=1`.
It includes all components, a six-variant / ten-state matrix, English and Arabic
copy, and the existing theme switcher. Only matrix hover/focus/pressed appearance
is forced with `data-state`.

## Validation

- TypeScript, ESLint, token gate and production build passed.
- Unit suite: 649 passed, 2 skipped, across 52 files.
- Browser: 19 checks passed in an isolated headless Chrome profile, covering async
  width retention and repeat-click guards, success/error reset and announcements,
  disabled explanations, locked controls, Radix menus and focus restoration,
  toggle groups, keyboard holding, timed and dialog confirmation, clipboard,
  file selection, Slot navigation, brand glyphs, RTL and touch target dimensions.
- All 108 visible matrix text/background samples passed 4.5:1 in light and dark,
  including hover/pressed scrims. Minimum measured ratio: 4.619:1.
- All inspected touch controls were at least 40 × 40px.
- No browser runtime errors.
- Accessibility-tree evidence: [accessibility.yml](accessibility.yml). Names,
  pressed/expanded/busy states and live-region content were checked in the browser.
  A manual VoiceOver/NVDA session was not performed.

## Screenshots

| Theme | English | Arabic / RTL |
| --- | --- | --- |
| Light | [Desktop](light-en.png) | [Desktop](light-ar.png) |
| Dark | [Desktop](dark-en.png) | [Desktop](dark-ar.png) |
| 390px | [Light viewport](mobile-en.png), [complete examples](mobile-en-full.png) | [Dark viewport](mobile-ar.png), [complete examples](mobile-ar-full.png) |

Screenshot styling hides the development toolbar and makes the existing gallery
header static so it does not obscure evidence. It does not change the application.
The matrix scrolls horizontally; the complete state measurements are in
[results.json](results.json).

## Reproduce

```sh
NEXT_BUILD_DIR=.next-buttons NEXT_PUBLIC_UI_GALLERY=1 npm run dev -- --webpack --hostname 127.0.0.1 -p 3105
# In another terminal:
npm run test:buttons
```

`BUTTON_GALLERY_URL` overrides the URL; `BUTTON_CHROME` overrides the installed
Chrome executable. The script uses a fresh temporary browser profile.
`NEXT_BUILD_DIR` permits isolated output alongside an existing dev server.
Schema validation used placeholder database URLs and made no database connection.

## Assumptions and inferred tokens

- The checked-out project uses Next 16, `app/tailwind.css`, and an existing
  `/design-system` gallery. These supersede the older paths/version in the brief.
- The root login redirect remains; no replacement `app/page.tsx` was introduced.
- Existing semantic tokens provide all colours; no new colour tokens were added.
  `secondary` uses `surface-2`/`text`; `destructive` uses `danger-fill`/`danger-ink`.
  The legacy `light` variant maps to semantic `solid`/`solid-ink`.
- Requested 28/32/36/40px size classes have a 36px minimum interactive height,
  raised to 40px on coarse pointers. Icon buttons also enforce minimum width.
- The explicit 120ms colour-fade requirement overrides the older 100ms motion
  token for this family. There is no scale, lift or rotating loading glyph.
- Controlled `status` remains until its caller changes it. `useAsyncButton` resets
  success/error after two seconds; clipboard and confirm controls use this hook.
- The provider glyphs use the official bundled Line Awesome brand font. Other
  icons continue through the project's existing `Icon` implementation.
