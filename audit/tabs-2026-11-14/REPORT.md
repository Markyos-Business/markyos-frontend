# Tabs family verification — 14 November 2026

Implemented the Radix-based compound family, preserving the existing generic
`tabs / active / onChange` API, external `TabPanel`, IDs and UI barrel imports.
The data-driven `items` shortcut supports the same trigger states and panels.

The family includes underline, segmented, boxed and vertical variants; responsive
lists; scroll arrows and fades; measured overflow with a More menu; dnd-kit pointer
and Alt + arrow reordering; closable/addable tabs; route links; lazy panels with
abort, retry, empty and retained-state behavior; language tabs; campaign steps;
and asynchronous unsaved-change guards. Tabs and all new components remain wave 2,
`in-review`. `npm run status` generates 81 registry entries.

## Validation

- Full check passed: TypeScript, ESLint, Prisma schema validation, unit tests,
  contrast/token contracts, logical properties, icon names, RTL and radius audits.
- Unit suite: 656 passed, 2 skipped, across 53 files.
- Production build passed with the gallery enabled and isolated output.
- Production browser suite: 21 checks passed. It covers ARIA panel links, positions/count/status names, automatic
  and manual activation, Home/End, vertical arrows, Tab re-entry, disabled reasons,
  guard refusal/acceptance, lazy loading and retained form state, empty/error
  panels, missing Arabic, linear steps, route links, Delete/add, Alt + arrows,
  pointer dragging, overflow menus, active-tab scrolling, mobile select, RTL,
  reduced motion and contrast.
- Separate legacy smoke check passed: controlled callbacks update the external
  panel, and `aria-controls` / `aria-labelledby` still link correctly.
- Tab text passed 4.5:1 in both themes; minimum measured ratio: 4.819:1.
- 390px English and Arabic layouts fit the viewport. The active tab remains visible
  after resize. Hover styling opts out of the app's inherited contrast-reducing veil.
- Browser names and states are recorded in [accessibility.yml](accessibility.yml).
  This is accessibility-tree verification; no manual VoiceOver/NVDA session was run.

## Screenshots and machine-readable results

| Theme | English | Arabic / RTL |
| --- | --- | --- |
| Light | [Desktop](light-en.png) | [Desktop](light-ar.png) |
| Dark | [Desktop](dark-en.png) | [Desktop](dark-ar.png) |
| 390px | [Mobile](mobile-en.png) | [Mobile](mobile-ar.png) |

[Results](results.json) include every browser check and contrast sample. Screenshots
hide the development toolbar only. The scrolling matrix intentionally shows a
subset of states at narrow widths; all states remain keyboard-reachable.

## Reproduce

```sh
NEXT_BUILD_DIR=.next-tabs NEXT_PUBLIC_UI_GALLERY=1 npm run dev -- --webpack --hostname 127.0.0.1 -p 3106
# In another terminal:
npm run test:tabs
```

For production verification:

```sh
NEXT_BUILD_DIR=.next-tabs-build NEXT_PUBLIC_UI_GALLERY=1 npm run build
NEXT_BUILD_DIR=.next-tabs-build NEXT_PUBLIC_UI_GALLERY=1 npm run start -- --hostname 127.0.0.1 -p 3107
TABS_GALLERY_URL=http://127.0.0.1:3107/design-system/tabs npm run test:tabs
```

The browser uses a fresh headless Chrome profile. `TABS_CHROME` overrides the Chrome
executable. Authentication refresh is stubbed as signed out in the UI-only browser
suite, so it does not contact the developer's backend. Schema validation used
placeholder database URLs and made no database connection.

## Assumptions and inferred tokens

- This checkout uses Next 16 and `app/tailwind.css`; those supersede the older
  version/path in the brief. The current root login redirect is retained.
- The gallery is embedded in `/design-system` and has a dedicated
  `/design-system/tabs` page behind `NEXT_PUBLIC_UI_GALLERY=1`.
- Existing `text`, `icon`, and `pill` names remain aliases alongside the new variants.
- Active states use `accent`, `accent-text`, `accent-soft`, `accent-on-soft` and
  `accent-ink`. Boxed edges use `hairline-strong`; no new colour tokens were added.
- Explicit 120ms colour and 180ms underline timing override the old motion timings
  for this family. Reduced motion uses the app's near-zero transition policy.
- `load(signal)` runs on panel mount; use a React key to reset a loader when its
  resource changes. `keepMounted` preserves children only after first activation;
  `forceMount` mounts immediately while keeping inactive content hidden.
- Editable items are controlled through `onItemsChange`; active selection is
  controlled or local. Closing an active file selects an enabled neighbor.
- Overflow retains the selected trigger in the tablist and moves other hidden
  sections into More, preserving a valid selected tab / panel relationship.
