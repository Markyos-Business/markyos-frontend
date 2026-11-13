# UI development guide

Reviewed: 12 November 2026. Scope: the current platform UI in
`markyos-frontend`, with differences from `landing-frontend` called out below.
This describes implemented styles and components, not a new visual proposal.
See [UX](UX.md) for behavior and [Functional](FUNCTIONAL.md) for permissions and
persistence. Update this guide with changes to the shared UI contract.

## Sources and precedence

Use runtime configuration and component implementations when older prose differs.

| Concern | Source |
| --- | --- |
| Theme variables | [tokens.js](../../tailwind/tokens.js) |
| Tailwind names, type scale, sizes, radii | [tailwind.config.js](../../tailwind.config.js) |
| Shared CSS and focus states | [base.js](../../tailwind/base.js), [CSS entry](../../src/app/tailwind.css) |
| Motion | [motion.js](../../tailwind/motion.js), [JS helpers](../../src/lib/motion.ts) |
| Generic components | [UI barrel](../../src/components/ui/index.ts), [form barrel](../../src/components/ui/index.ts) |
| Shell and navigation | [layout components](../../src) |
| Client guideline rendering | [guideline-site](../../src/features/guideline-site), [token contract](../token-contract.md) |

The older [UI reference](../ui/README.md) and [design export](../MARKYOS_UI.md)
contain useful detail but are not proof that every screen follows every rule.
In particular, the old token guide's 120/180ms motion timings differ from the
current 100/150/200/280/500ms scale.

## Colors and theme

The internal UI supports `system`, `light`, and `dark`. The preference is stored
under `markyos:theme`; a script stamps `data-theme` before hydration. The CSS
base is dark, but a fresh browser normally follows its system preference.
See [ThemeProvider](../../src/contexts/ThemeProvider.tsx) and the shared
[theme bootstrap](../../src/lib/interfaceTheme.ts). The server layout must
import inline script text from a module without `"use client"`; otherwise the
RSC payload contains an asynchronous client reference in `<head>` and can
interrupt production hydration. Keep browser preferences out of SSR date
initializers, and check production builds for hydration errors and warnings.

Use semantic classes, not a fixed hex value or a separate `dark:` class for each
color. Values below are the current tokens; changing a token requires updating
its Tailwind fallback and running the color/contrast checks.

| Role / class suffix | Dark | Light | Use |
| --- | --- | --- | --- |
| `canvas` | `#000000` | `#ffffff` | App background |
| `surface-0`, `surface-1` | `#111111` | `#ffffff` | Cards and panels |
| `surface-2` | `#1a1a1a` | `#f5f5f5` | Raised controls and fills |
| `surface-3` | `#242424` | `#ededed` | Stronger raised surface |
| `text` | `#ffffff` | `#0a0a0a` | Main text |
| `text-secondary` | `#dbdbdb` | `#171717` | Secondary text |
| `text-muted` | `#c4c4c4` | `#6b6b6b` | Supporting copy |
| `text-faint` | `#afafaf` | `#6b6b6b` | Captions |
| `accent` | `#0099ff` | `#0055ff` | Interactive accent |
| `accent-text` | `#5cb9ff` | `#0055ff` | Accent-colored text |
| `success` | `#00de68` | `#007a52` | Successful state |
| `warning` | `#ffbb00` | `#8a5c00` | Warning state |
| `danger` | `#ff8fb4` | `#c80009` | Error/destructive text |
| `info` | `#00ccff` | `#004a5f` | Information |

Use `*-soft` fills with their corresponding text tokens; use `accent-ink` on
solid accent and `solid-ink` on `solid`. `danger-fill` differs from `danger`:
the former is a saturated fill, the latter is contrast-adjusted text. Disabled
text is not a substitute for muted readable copy. Fixed `brand-*` and
`secondary-*` palettes are for brand artwork and charts, not general UI text.

Cards primarily separate through surfaces and inset `shadow-edge` rules.
Floating menus/dialogs use the theme's elevation shadow. Avoid adding a drop
shadow to every card.

Published guidelines have their **own brand-derived palette** and `--g-*`
tokens. Changing the studio theme must not change a client's brand colors.
Preserve the template token contract when adding a template or section.

## Typography

[fonts.ts](../../src/app/fonts.ts) loads Inter, IBM Plex Sans Arabic, and local
Bricolage Grotesque. The product's `font-sans` and `font-display` map to Inter
with Arabic fallbacks; `font-brand` is a separate brand/marketing stack. Do not
assume the existence of a loaded font makes it the product heading font.

| Named size | Size / line height | Typical use |
| --- | --- | --- |
| `text-h1` | 32 / 48px | Page title |
| `text-h2` | 26 / 40px | Large value |
| `text-h3` | 20 / 32px | Section heading |
| `text-h4` | 18 / 27px | Dialog title |
| `text-h5` | 16 / 24px | Panel title |
| `text-body` | 14 / 21px | Body and controls |
| `text-caption` | 12 / 18px | Label, hint, metadata |
| `text-overline` | 12 / 12px | Short uppercase labels |

Use weight 400 for ordinary text and 500 for emphasis. `font-semibold` and
`font-bold` are mapped to 500 in the platform config. Older `text-ui-*` sizes
and arbitrary sizes still occur, including sub-12px metadata and beta tags;
the existence of those usages is not a blanket recommendation to copy them.
Prefer the named scale and verify small text at actual viewing size.

Use `dir="auto"` for mixed-language user content where appropriate. URLs,
color values, and code usually need explicit LTR treatment inside RTL pages.
Interface language and the brand's primary content language are separate.

## Spacing, geometry, and page layout

The named spacing scale is measured rather than a uniform 4/8px progression.

| Class suffix | `space-1` | `space-2` | `space-3` | `space-4` | `space-5` | `space-6` | `space-7` | `space-8` | `space-9` | `space-10` | `space-11` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Pixels | 4 | 5 | 8 | 10 | 14 | 18 | 19 | 25 | 26 | 32 | 40 |

Common metrics: standard controls 46px; compact controls 40px; field block 72px;
rail 84px; top bar 84px. These are component defaults, not a rule to force all
inspector controls or auth layouts into the same dimensions.

Common radii: `rounded-sm` 4px, `rounded-md` 6px, `rounded-lg` 8px,
`rounded-card`/`rounded-widget` 15px, `rounded-feature` 25px, `rounded-full` for
circles/pills. The radius audit restricts unsupported alternatives.

[AppLayout](../../src/features/shell/components/app-layout.tsx) is one viewport
high (`h-screen overflow-hidden`). The page's designated content pane scrolls;
children normally need `min-h-0`, `min-w-0`, and the appropriate overflow rule.
Do not fix a scrolling defect by letting the entire shell grow indefinitely.
Reuse `PageContainer`, `PageShell`, `PageHeader`, and the existing feature shell
rather than reimplementing padding, headers, and navigation.

## Navigation and responsive behavior

`AppSidebar` supports a 240px expanded sidebar or an 84px icon rail. It remembers
collapse preference, and `[` toggles it outside text editing. At widths up to
900px it uses the rail; below the `md` breakpoint (768px), `AppLayout` hides the
inline sidebar and exposes the full navigation in a phone drawer. The drawer
uses expanded labels rather than placing another collapsed rail inside it.

Standard Tailwind breakpoints are 640, 768, 1024, 1280, and 1536px; configured
extras are 1600 and 1850px. The 900px JavaScript panel threshold is a separate
behavioral decision, not a Tailwind breakpoint. Builder panels also use the
shared narrow-viewport hook.

Use logical properties (`ps`, `pe`, `ms`, `me`, `start`, `end`, `text-start`).
Directional arrows may mirror; logos must not. Navigation visibility is role
sensitive, but UI hiding does not replace API authorization.

On small screens, let controls wrap, constrain popovers to the viewport, and
keep horizontal overflow inside a genuinely wide table/canvas rather than on
the document. Auth screens were visually checked at 390px and 1440px during
this review; authenticated feature layouts were read from source, not fully
browser-tested for this documentation task.

## Components, forms, and feedback

| Need | Existing implementation | Guidance |
| --- | --- | --- |
| Actions | [buttons](../../src/components/ui/button) | Use `Button`, `IconButton`, and action dropdowns; preserve busy/disabled handling and accessible names. |
| Grouped content | [cards](../../src/components/ui/card), `Section` | Reuse the established header/body/action arrangement. |
| Fields | [form fields](../../src/components/ui) | `InputField`, `TextareaField`, selects, checkboxes; compact variants for dense inspectors. |
| Upload/color/choice input | [form](../../src/components/ui) | Reuse upload, color, radio-card, toggle, and repeater controls rather than feature-specific copies. |
| Tabs and filters | [tabs](../../src/components/ui/tabs), [filters](../../src/components/ui/filter-chip.tsx) | Use `useTabIds()` with `Tabs` and `TabPanel`; keep selection visible and give every row an accessible name. |
| Loading | [loading](../../src/components/ui) | Skeletons should match the pending content's shape. |
| Empty/error | [empty](../../src/components/ui/empty-state) | Distinguish no records from no matching results and failed loading. |
| Overlays | [overlays](../../src/components/ui/overlay) | Reuse modal/dialog, toast, and dismissal behavior. |

`InputField` is an underlined field, normally without a boxed background. It
connects label, control, and hint/error IDs; errors set invalid state and are
announced. Required marks accompany native required semantics. Do not use a
placeholder as the only label. Preserve entered values after validation or
network errors, disable duplicate submissions while busy, and use form-level
errors for failures that do not belong to one field.

Shared modal code handles focus containment and focus return. Use the dialog
provider for confirmations/prompts and the toast provider for transient action
feedback. Reserve persistent banners or inline error states for problems the
person must act on; a disappearing toast is insufficient for a blocked page.
Do not announce an API success before the request succeeds. Background document
sync has different guarantees; see [UX states](UX.md#saving-and-feedback).

## Tables

[DataTable](../../src/components/ui/table/data-table.tsx) composes column
renderers, sorting, optional selection, bulk actions, pagination, loading, and
errors. A column's `sortValue` enables local sorting; server sorting uses the
callback contract. Do not silently sort one downloaded page and present it as a
global server sort. Similarly, a pagination footer must use the actual total
for the chosen local/server mode.

Use semantic table headers and cells, `TableLoadingRow`/`TableEmptyRow` for
body states, and accessible row/action controls. Preserve keyboard behavior and
avoid a row click swallowing links or buttons inside that row. Test long
Arabic/English values and narrow-width overflow with the real columns.

## Branding and differences from the landing frontend

Platform originals are in [public/brand](../../public/brand); canonical supplied
files are also in the sibling `markyos-brand` folder. `MarkyosLogo` is the app
entry point and carries the beta tag. The login's lockup chooses the actual
Arabic artwork when `isAr` is true. Legacy root asset URLs remain for saved demo
content. The browser icon is [app/icon.svg](../../src/app/icon.svg).

The landing site's `Logo`/`Mark` components use SVG files as `currentColor`
masks and choose lockups by locale. The platform currently uses `<img>` plus a
theme inversion token; its wordmark variant is Latin-only. These rendering and
locale differences remain implemented differences. Do not assume every logo
usage has Arabic artwork merely because the login does.

The landing frontend has a separate font setup, CSS system, and Payload admin.
Do not transfer its font or spacing rules into platform chrome without checking
the platform tokens. Its token-sync script still defaults to an obsolete
`markyosmvp` path and can skip checking drift when that source is missing.

## Motion and accessibility when extending UI

Current motion durations: instant 100ms, fast 150ms, base 200ms, slow 280ms,
chart 500ms. `usePresence`, `motionClass`, `FadeIn`, and `Stagger` cover common
entry/exit behavior. Reduced motion removes travel/scale and reduces durations.
Prefer transform/opacity; preserve shared exceptions for collapsible grids and
sidebar width. Theme changes intentionally suppress intermediate transitions.

Before shipping a UI change:

- Use the existing primitive and token, or add a reusable primitive/token once.
- Check keyboard order, labels, focus visibility, focus return, and error announcements.
- Check light/dark, Arabic/English, long content, and phone/desktop widths.
- Test loading, empty, validation, server error, busy, and disabled states.
- Run `npm run check`; database URL variables are required by Prisma validation
  even though Prisma is not the active application persistence layer.
- Run the relevant browser sweep/E2E test for changed behavior. Audits check
  selected contracts; passing them is not a complete accessibility assessment.

### Keyboard tabs

Use shared `Tabs` with `useTabIds()` and a matching `TabPanel` (`id={ids.panelId}`, `tabsId={ids.id}`, `active={active}`). Every tab points to the changing panel; its label names that panel. Builder tool `Segments` uses the same navigation hook when `asTabs` is enabled. Ordinary segmented settings remain buttons.

These controls activate immediately on arrow movement because their panels update locally. Horizontal arrows follow the rendered LTR/RTL direction; vertical groups use Up/Down. Home/End select the first/last enabled tab, arrows wrap and skip disabled items, and Tab leaves the group. Keep one tab in the page tab order. Do not autofocus newly mounted panel inputs: this steals focus during arrow navigation. For future panels that require slow network work, explicitly design manual activation rather than silently changing this contract.

Keep the inset focus outline on scrolling rows; a positive outline offset is clipped by their overflow container. Solid selected icon tabs use the existing accent-ink focus color. Verify keyboard scrolling at 375px and both directions. Run `npm run sweep:tabs` against a browser-only development server with `NEXT_PUBLIC_UI_GALLERY=1`; see the script header for environment variables. Custom legacy tablists are not automatically covered by this primitive.

### Inline guideline editing

`EditableText` requires a `label` describing the field, independently of its value and visual placeholder. It exposes `aria-multiline` from the editing mode. Supply localized field purpose and block context (for example “Quote: Quote” or “Metric: Metric value”); sample values such as “100%” are not labels. Section heading and guidance wrappers supply interface-language names. Published views retain ordinary text semantics. New block kinds must provide a meaningful label when adding an inline editor.

### Discovery section tabs

Discovery builder section tabs use the same navigation hook while retaining their question drop targets. Keep Add section outside the tablist and keep the selected section editor inside its labelled `TabPanel`. After deletion, resolve selection to a surviving section before deriving its roving tab stop and panel label.

### Empty select values

Enabled Listbox and searchable Combobox placeholders use `text-muted`; reserve `text-disabled` for disabled controls. Test empty single and multiple selections as well as populated values when changing shared field styling. The gallery’s three enabled empty selects pass 4.5:1 in light/dark themes; `scripts/sweeps/select-contrast.mjs` measures rendered colors and runs axe contrast checks.

### Trend descriptions

`TrendChip` exposes its description as screen-reader-only text. Pass a localized `label` describing direction, amount and comparison period when known; the fallback remains direction plus value. Keep the visible value and arrow decorative to avoid duplicate announcement. Do not put `aria-label` on the generic wrapper span. Verify the styleguide with `scripts/sweeps/trend-accessibility.mjs` after changing this pattern.

### Inline links in supporting copy

Keep inline navigation links distinguishable at rest with `underline underline-offset-2` alongside the existing accent text token. Hover-only underlining does not distinguish a resting link when its luminance is close to adjacent copy. The moodboard project/detail footnote shares this treatment in both languages; retain the global keyboard focus outline.

### Scrollable code examples

The settings API example is a named region with `tabIndex={0}`, so keyboard users can focus it and scroll horizontally with native arrow keys. Keep its bilingual accessible name, global visible focus treatment and LTR code direction. Do not intercept Tab or add a keyboard trap. Verify real overflow at phone widths, plus desktop and all roles, with `scripts/sweeps/settings-code.mjs`.

### Audit maintenance rules (versions 1.10–1.19)

- Keep shared sort headers and compact back links at least 24×24px without enlarging their type.
- Brand creation uses phone padding and bounded tabs. Tooltips clamp to viewport edges and recalculate on resize, scroll and direction changes; keep intentional table/canvas scrolling local.
- Arabic labels use normal tracking at the text node, including in LTR canvas chrome. Latin tracked labels retain their existing treatment.
- Use `motion-safe` for the builder tools entrance; reduced-motion users get an immediately visible panel.
- Keep route names in `src/lib/i18n/pageTitles.ts`. The title catalog test covers every current page route, so new routes require English and Arabic names. Only authorized workspace routes include a brand name; public shares never put tokens or record contents in the title.
- The page shell owns h1. Use `PageHeader.headingLevel` for embedded examples, h3 in questionnaire previews, and subordinate template cover headings. Public guideline pages supply a screen-reader h1 even when their branded cover only displays an image.
- Discovery section tabs keep Add section outside the tablist. Preserve labelled panel relationships and roving focus after add/delete and keep drag targets attached to the section buttons.

Run `scripts/sweeps/audit-rounds.mjs` with `AUDIT_ROUND` set to the relevant finding. The final builder sweep uses disposable discovery HTTP fixtures; API-backed form checks require an isolated preview whose offline shell gate is bypassed solely for those fixtures. Never apply that bypass to production source.

### Chart data points

The shared SVG chart is a named group. Each focusable data-point hit area has
`role="img"` and a label containing its period and series values. Focus shows
the same tooltip as hover. Do not use a button role without an action. The
trend accessibility sweep checks `aria-prohibited-attr` in both languages,
themes and viewport widths.

Focusable tab panels are content entry points. Keep their keyboard focus
checks, but do not demand pointer cursors or hover fills intended for actions.

## November audit implementation (2026-11-13)

Account pages use `AccountHeader`; brand pages use a compact breadcrumb, account menu and a separate wrapping actions row. Keep Team and Settings in the sidebar footer; group identity, strategy, guideline, research and tools. Assets has its own `/w/[slug]/assets` entry. Account navigation follows account type and configured API capability.

Brand identity and strategy tabs use `useUrlTab`, roving keyboard focus and a linked `TabPanel`. Preserve other query parameters and browser history. Shared tab rows must not shrink to zero in constrained flex layouts. Arabic uses Plex after Inter without an Arial metric fallback; check actual platform fonts when changing font configuration.
