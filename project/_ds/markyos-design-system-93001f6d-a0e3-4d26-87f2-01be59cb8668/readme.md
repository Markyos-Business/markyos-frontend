# Markyos Design System

Markyos is a SaaS **digital asset management and brand governance** platform for the
MENA market and globally-minded design studios. Its differentiator is native
Arabic/English bidirectional support: every asset, field, review step and layout works
in RTL and LTR without a separate build — a capability the incumbent enterprise DAM
players largely lack.

This repository is the design system behind that product: tokens, foundations,
reusable UI primitives, brand assets and a click-through recreation of the app.

---

## Sources this system was built from

| Source | What it gave us | Access note |
| --- | --- | --- |
| **`CRM UI Kit for SaaS Dashboards (Community).fig`** — attached, mounted read-only | The entire component inventory, all colour values, the type scale, every measured metric, and the app shell | Community Figma file. The reader may not have it; every value used here is transcribed into `tokens/`. |
| `.fig` page `1. UI Kit` (6 frames) | Vector truth: colour palette, typography specimen, buttons, forms, form elements, icon font sheet | — |
| `.fig` page `3. Dashboard` | Vector truth: navigation rail, top bar, counters, sidebar widgets, table widgets | Not in the user's scoped frame list, but the only vector source for the app chrome the scoped screens display. |
| `.fig` pages `Project`, `Products`, `File-Browser`, `Invoices`, `Notification`, `Reports`, `Help-Center`, `Task`, `Calendar` (125 scoped frames) | Screen layouts | **These frames are flattened bitmaps in the source file** — one JPEG per frame, no text or layers. They are the reference for layout only. |
| `uploads/Logo-01.svg`, `Logo-02.svg`, `Logo-03.svg` | The Markyos wordmark, lockup and mark | Copied to `assets/`. |
| `uploads/BricolageGrotesque*.ttf` (105 files) | The brand typeface, all optical sizes and widths | The default optical size (300–800) plus one condensed weight are shipped in `assets/fonts/`; the rest stay in `uploads/`. |

### Two identities, deliberately separated

The `.fig` is a third-party CRM UI kit whose sample content belongs to its author
("CraftUI"). None of that author's branding is carried in. **Markyos** identity comes
only from the user-supplied logos and Bricolage Grotesque. The kit supplies the
*system* — values, metrics, component behaviour. Nothing in this repo infers a company
from the kit's sample copy.

---

## Content fundamentals

How Markyos writes, taken from the kit's own UI copy and extended for the product's
bilingual subject matter.

**Voice.** Plain, operational, declarative. The interface names the thing and stops:
"Asset Library", "Rights expiring", "Needs Arabic", "Awaiting council". No marketing
verbs in product chrome, no exclamation, no personality tics.

**Person.** Product UI is impersonal — labels, not sentences. Where ownership matters
it is **second person possessive**: "My assets", "Shared with me", "Your tickets".
Never "I"/"we" in the app; "we" appears only in marketing.

**Casing.** Sentence case everywhere: headings ("Asset details"), buttons
("Add asset", "New invoice"), field titles ("Project name"). **UPPERCASE** is a
typographic role, not a copy decision — it is applied by the overline/tab/link-button
styles only ("LIST", "GRID", "SORT:", "PREV", "VIEW ALL"). Never type copy in caps.

**Length.** Field titles 1–3 words. Button labels 1–3 words, verb-first
("Add task", "Mark all reviewed"). Panel nav items get a title plus one clause of
description: *"Rights expiring" / "Licences ending in 30 days"*. Empty and error
states get one sentence, no apology: "No topics match “rights”."

**Numbers and units.** Values are bold, units are not: **90** / 148 · **42.6 Gb**
uploaded · **SAR 84,500**. Relative time is abbreviated with no space: `10m`, `1hr`,
`2d`. Dates are `12 Sep`, `31 Dec 2026` — never US ordering, since the audience is
MENA and Europe.

**Bilingual copy rules.** Every user-facing string exists in `en` and `ar`. Arabic is
never a transliteration of the English structure — it is written natively and may be
shorter, so no layout may depend on string length. Locale codes are shown in full
(`ar-SA`, `en-US`) rather than flags: a language is not a country.

**Emoji: never.** Not in UI, not in empty states, not in notifications. The kit
contains none and the icon font covers every glyph need.

**Sample tone, verbatim from the kit:** `Page title` · `Field title` ·
`Start typing…` · `View all` · `Week comparison` · `Tasks complete`. Note the real
ellipsis character in placeholders.

---

## Visual foundations

**Colour.** One accent — `#5E81F4` primary blue — against a two-value neutral ground:
`#F5F5FA` page, `#FFFFFF` card. Ink is `#1C1D21`; all secondary text is `#8181A5`
(a violet-leaning grey, not a neutral one — this is what gives the system its cool
cast). Four semantics: success `#7CE7AC`, warning `#F4BE5E`, danger `#FF808B`, info
`#40E1FA`. All four are deliberately *soft* — pastel-weight, never saturated alarm
colours. Extended secondaries (`#9698D6`, `#CB68FE`, `#2DE6FF`, `#3F3D56`) are for
charts and illustration only.

**The 10% rule.** Every soft fill in the system is its hue at **10% opacity over
white** — ghost buttons, tag backgrounds, badges, icon tiles, the active rail item.
There are no separate "light blue"/"light green" hexes. Widget rows use `#F5F5FA` at
**40%**. Learn these two numbers and you can build any new surface correctly.

**Type.** Product UI is **Lato**: Bold for every heading and every value, Regular for
paragraphs and secondary text, Black only for uppercase overlines. The scale is fixed
and small — 32/26/20/18/16 for headings, 14 for body, 12 for secondary — with
hard-coded line-heights (32/48, 20/32, 14/21, 12/18). **Source Sans 3** appears in the
kit's form specimens and is kept for fidelity. **Bricolage Grotesque** is the brand
face: wordmark, marketing, presentation display — never product chrome.

**Spacing.** Not a 4/8 grid, and it should not be forced onto one: 5, 13, 19, 22, 25,
26 are real values in the source. Component heights are fixed and memorable — button
46, tab 40, input block 72, tag 36, status tag 28, badge 24, rail 84 wide, rail item
64, top bar 84, widget row 72.

**Backgrounds.** Flat colour. No gradients, no textures, no patterns, no photography
in chrome. The only gradient-shaped thing in the file is a tint expressed as a
two-stop overlay, which is just an alpha fill. Illustrations exist only in the empty
states of the source's raster screens; none were extractable, so empty states here are
type and icon.

**Corner radii.** 4 (checkbox, rail tile) · 6 (pagination cell, status tag) ·
8 (buttons, tags, icon tiles) · 10 (widget rows) · 12 (cards, counters) ·
pill (radio, presence dots). Radius encodes size class, so pick by component, not by taste.

**Cards.** White, 12px radius, **no drop shadow** — a 1px `#F0F0F3` hairline instead,
drawn as an inset shadow. Grid item cards inside a card get the same hairline. The
system is essentially flat: `--shadow-soft` and `--shadow-raised` exist for menus and
overlays only.

**Borders.** Drawn as `box-shadow: inset 0 0 0 1px …`, not CSS borders — that is how
the source builds them, and it keeps geometry stable. Three values: `#5E81F4` (outline
button), `#ECECF2` (resting outline), `#F0F0F3` (subtle divider). The one real 1px
border in the system is the input underline.

**Hover and press.** One treatment for everything: `#1C1D21` at **35%** laid over the
resting fill. Not a darker hex, not an opacity change on the element, not a lift.
Applied identically to primary buttons, tags and colour swatches. Press is the same
scrim — no shrink, no shadow change. Focus is a 2px primary outline at 2px offset.

**Transparency and blur.** Alpha is used for tints and the hover scrim. **Blur is
never used** — no frosted panels, no backdrop filters, no protection gradients. Text
over imagery is not a pattern in this system; where an image needs a label, the label
sits on an opaque card beside it.

**Animation.** The source is a static file: it defines states, not motion. The system
therefore moves as little as possible — 120ms colour/opacity/shadow crossfades on
state change, 180ms on the switch knob and progress fill, `cubic-bezier(.4,0,.2,1)`.
No bounce, no spring, no entrance animation, no parallax.

**Layout.** Fixed left rail (84px, sticky full height, 2px `#F0F0F3` right separator).
Optional secondary panel (~600px, white, its own 84px header aligned to the top bar).
Content area: transparent 84px top bar over the `#F5F5FA` ground, then one white
`SurfaceCard` per view holding toolbar → column header → body → pagination. Design
width 1680×1020, as the source frames are drawn.

**Imagery.** Colour-neutral and bright — the source's baked photography is daylight,
low-contrast, unfiltered, no grain, no duotone. No brand illustration set was
extractable from the file.

**Direction.** Layouts are authored LTR and mirrored with `dir="rtl"`. Directional
glyphs (arrows, chevrons, sort, next/prev) flip; brand marks, logos and media controls
never do. Numerals stay Western Arabic unless a customer requests otherwise.

---

## Iconography

**One system: Line Awesome 1.3.0** (Icons8). The source file uses it as three text
faces — `la-solid-900` (55 uses), `la-brands-400` (40), `la-regular-400` (39) — and
nothing else. Every glyph in every component is a font character, not an SVG.

* **No local binary shipped.** The `.fig` references the font by family name only,
  so `tokens/fonts.css` loads Line Awesome from jsDelivr. This is the icon set the
  file names, not a substitute — but the binary is CDN-hosted rather than vendored.
  *If you need it offline, upload the Line Awesome webfont files and we will vendor
  them into `assets/fonts/`.*
* Sizes: **16px** (tabs, tag close, small meta), **18px** (buttons, list rows, link
  buttons), **22px** (navigation rail, top bar). Nothing else.
* Colour: `#8181A5` at rest, `#5E81F4` when active or on a tint, `#FFFFFF` on primary
  fills, semantic hue for status glyphs.
* Icon tiles: the glyph centred on a 38–46px rounded square filled with its hue at 10%.
* **Brand glyphs** (`lab la-dribbble`, `la-behance`, `la-sketch`, `la-adobe`) come from
  the same font — the source uses them as file-type and integration marks.
* **No SVG icons, no PNG icons, no emoji, no Unicode symbols as icons.** Use
  `<Icon name="…" />`. If a glyph is missing from Line Awesome, ask before drawing one.

**Logo.** Three user-supplied SVGs in `assets/`: `markyos-wordmark.svg` (type only),
`markyos-lockup.svg` (mark + type), `markyos-mark.svg` (mark only, for the rail and
favicon). On dark or primary grounds the lockup is reversed with `filter: invert(1)`.
No other marks exist — the "CraftUI Logo" symbol in the source is the kit author's and
was deliberately not imported.

---

## Index

**Root**

| File | What it is |
| --- | --- |
| `styles.css` | The single entry point consumers link. `@import` lines only. |
| `readme.md` | This guide. |
| `SKILL.md` | Agent Skills front-matter so this folder works as a Claude Code skill. |
| `thumbnail.html` | Homepage tile for the design system. |
| `tokens/` | `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `shape.css`, `motion.css`, `interactions.css` |
| `assets/` | Logos and the Bricolage Grotesque binaries (`assets/fonts/`) |
| `guidelines/` | 21 foundation specimen cards (Colors, Type, Spacing, Shape, Brand) |
| `components/` | The UI primitives, below |
| `ui_kits/markyos-app/` | Click-through recreation of the product — see its own README |

**Components** (`window.MarkyosDesignSystem_93001f`)

| Group | Components |
| --- | --- |
| `components/core/` | **Icon**, **SurfaceCard** |
| `components/actions/` | **Button**, **ArrowButton**, **LinkButton** |
| `components/forms/` | **Input**, **Checkbox**, **Radio**, **Switch** |
| `components/data/` | **Tag**, **StatusTag**, **Badge**, **ProgressBar** |
| `components/navigation/` | **Tabs**, **Pagination**, **NavRail**, **TopBar** |
| `components/widgets/` | **MetricCounter**, **ActivityRow**, **MessageRow** |
| `components/charts/` | **SparkCounter**, **BarGraph**, **LineGraph**, **DonutChart**, **TableWidget** |
| `components/kit-aliases/` | 81 source-vocabulary aliases — listed below |

Each has a sibling `.d.ts` (props contract) and `.prompt.md` (what & when, usage,
variants), plus one `@dsCard` HTML per directory.

### How the source inventory maps to these 24 components

The `.fig` lists 251 "component families", but it has **no component sets** — every
state is a separate standalone symbol (`Buttons / Plain / Primary / Resting`,
`… / Hover`, `… / Active`, `… / Disabled` are four entries for one control), and ~180
of the 251 are the flattened *screen* symbols, not primitives.

Collapsed correctly, the source defines exactly these families, and all of them are
built (24 components):

| Source family | Built as |
| --- | --- |
| Buttons / Plain / Primary · Outline (Resting, Hover, Active, Disabled) | `Button` (`variant`, `active`, `disabled`) |
| Buttons / Icon / Primary · Outline (Resting, Hover, Active, Disabled) | `Button` with `icon` |
| Buttons / Icon / … / Arrow | `ArrowButton` |
| Buttons / Link Button / Active | `LinkButton` |
| Forms / Input (Inactive, Active Basic, Active Icon on Left/Right, Disabled, Error, Error With, Success, Success With) | `Input` (`state`, `icon`, `iconSide`, `hint`) |
| Forms / Checkbox (Resting, Active, Error, Success) | `Checkbox` |
| Forms / Radio (Resting, Active, Error, Success) | `Radio` |
| Forms / Switches (Off, On, Error, Success) | `Switch` |
| Tags / Primary · Blue · LightBlue · Grey · GreyEditable · Red · Green · Yellow | `Tag` (`tone`, `removable`) |
| Tags / Status tag | `StatusTag` |
| Badge / Oval · Round | `Badge` (`shape`) |
| Progress Bars / Resting · Low · Medium · High · Full · Primary | `ProgressBar` |
| Tabs / Text (Resting, Active) · Tabs / Icon (Resting, Active) | `Tabs` (`variant`) |
| Pagination / Boxed · Fullsize · Primary | `Pagination` (`variant`) |
| Navigation Web / Icons + Icons Items (Resting, Active) | `NavRail` |
| Navigation Web / Top Bar | `TopBar` |
| Counters / Bar Numeric / Web | `MetricCounter` |
| Widgets / Sidebar / Event · Calendar Event | `ActivityRow` |
| Widgets / Sidebar / Message | `MessageRow` |
| Counters / Graph / Web | `SparkCounter` |
| Graphs / Bars Vertical · Graph Sidebar | `BarGraph` |
| Graphs / Single · Single With Counters · Orders Web Wave · Scheduled Web | `LineGraph` |
| Widgets / Graphs / Pie | `DonutChart` |
| Tables / Events List · Invoices List Widget · Sales List Widget · Sales Small List Widget | `TableWidget` |

**Not built, and why**

* **The ~180 screen symbols** (`Projects / Grid / 01`, `Files / Details`,
  `Invoices / List / 02`, every `[Mobile]` variant, …) are flattened bitmaps in the
  source — no layers, no text, nothing to extract. They are recreated as *screens* in
  `ui_kits/markyos-app/`, not as components, and the mobile variants are not built.
* **`Counters / Graph`, `Graphs / *`, `Widgets / Graphs / Pie`, `Tables / * Widget`,
  `Calendar`, `Calendar / Day · Week · Event`** are vector but live on pages the user
  did not scope (`3. Dashboard`, and the Calendar page's own symbols are raster). The
  calendar month grid is recreated inside the UI kit screen; the chart family now lives in
  `components/charts/`.
* **`UI Kit Header`, `CraftUI Logo`, `Fill`, `Icons`, `Line`, `Bg`** are the kit's own
  documentation furniture and the file author's brand — intentionally excluded.

### Source-vocabulary aliases (`components/kit-aliases/`)

Every primitive symbol in the Figma file also exists here under **its exact Figma
name**, as a thin alias that renders the real component with that symbol's state
locked in. Use these when you are working from the file's vocabulary; use the 24
components above in new work.

`BadgeOval` · `BadgeRound` · `ButtonsIconOutlineActive` · `ButtonsIconOutlineArrow` · `ButtonsIconOutlineHover` · `ButtonsIconOutlineResting` · `ButtonsIconPrimaryActive` · `ButtonsIconPrimaryArrow` · `ButtonsIconPrimaryDisabled` · `ButtonsIconPrimaryHover` · `ButtonsIconPrimaryResting` · `ButtonsLinkButtonActive` · `ButtonsPlainOutlineActiveButton` · `ButtonsPlainOutlineDisabled` · `ButtonsPlainOutlineResting` · `ButtonsPlainPrimaryActive` · `ButtonsPlainPrimaryDisabled` · `ButtonsPlainPrimaryHover` · `ButtonsPlainPrimaryResting` · `CountersBarNumericWeb` · `CountersGraphWeb` · `FormsCheckboxActive` · `FormsCheckboxError` · `FormsCheckboxResting` · `FormsCheckboxSuccess` · `FormsInputActiveBasic` · `FormsInputActiveIconOn` · `FormsInputDisabled` · `FormsInputInactive` · `FormsInputStatesError` · `FormsInputStatesErrorWith` · `FormsInputStatesSuccess` · `FormsInputStatesSuccessWith` · `FormsRadioActive` · `FormsRadioError` · `FormsRadioResting` · `FormsRadioSuccess` · `FormsSwitchesError` · `FormsSwitchesOff` · `FormsSwitchesOn` · `FormsSwitchesSuccess` · `GraphsBarsVertical` · `GraphsGraphSidebar` · `GraphsOrdersWebWave` · `GraphsScheduledWeb` · `GraphsSingle` · `GraphsSingleWithCounters` · `NavigationWebIcons` · `NavigationWebIconsItemsActive` · `NavigationWebIconsItemsResting` · `NavigationWebTopBar` · `PaginationBoxed` · `PaginationFullsize` · `PaginationPrimary` · `ProgressBarsFull` · `ProgressBarsHigh` · `ProgressBarsLow` · `ProgressBarsMedium` · `ProgressBarsPrimary` · `ProgressBarsResting` · `TablesEventsList` · `TablesInvoicesListWidget` · `TablesSalesListWidget` · `TablesSalesSmallListWidget` · `TabsIconActiveTab` · `TabsIconRestingTab` · `TabsTextActive` · `TabsTextResting` · `TagsBlue` · `TagsGreen` · `TagsGrey` · `TagsGreyEditable` · `TagsLightBlue` · `TagsPrimary` · `TagsRed` · `TagsStatusTag` · `TagsYellow` · `WidgetsGraphsPie` · `WidgetsSidebarCalendarEvent` · `WidgetsSidebarEvent` · `WidgetsSidebarMessage`

### Component naming — confirmed intentional

The source names symbols as slash-paths with the state baked in
(`Buttons / Plain / Primary / Hover`). Those are not usable API names, so every
component here is named for the *family* and the state moved into props. This is
deliberate; the mapping above is the contract. Explicitly:

| Component | Source family it renames | Status |
| --- | --- | --- |
| `Button` | `Buttons / Plain / *` + `Buttons / Icon / *` | renamed family — intentional |
| `ArrowButton` | `Buttons / Icon / … / Arrow` | renamed family — intentional |
| `LinkButton` | `Buttons / Link Button / Active` | renamed family — intentional |
| `Input` | `Forms / Input / *` | renamed family — intentional |
| `Checkbox` | `Forms / Checkbox / *` | renamed family — intentional |
| `Radio` | `Forms / Radio / *` | renamed family — intentional |
| `Switch` | `Forms / Switches / *` | renamed family — intentional |
| `Tag` | `Tags / Primary · Blue · LightBlue · Grey · GreyEditable · Red · Green · Yellow` | renamed family — intentional |
| `StatusTag` | `Tags / Status tag` | renamed family — intentional |
| `Badge` | `Badge / Oval · Round` | renamed family — intentional |
| `ProgressBar` | `Progress Bars / *` | renamed family — intentional |
| `Tabs` | `Tabs / Text / *` + `Tabs / Icon / *` | renamed family — intentional |
| `Pagination` | `Pagination / Boxed · Fullsize · Primary` | renamed family — intentional |
| `NavRail` | `Navigation Web / Icons` + `Icons Items / *` | renamed family — intentional |
| `TopBar` | `Navigation Web / Top Bar` | renamed family — intentional |
| `MetricCounter` | `Counters / Bar Numeric / Web` | renamed family — intentional |
| `ActivityRow` | `Widgets / Sidebar / Event` + `Calendar Event` | renamed family — intentional |
| `MessageRow` | `Widgets / Sidebar / Message` | renamed family — intentional |
| `SparkCounter` | `Counters / Graph / Web` | renamed family — intentional |
| `BarGraph` | `Graphs / Bars Vertical` + `Graph Sidebar` | renamed family — intentional |
| `LineGraph` | `Graphs / Single` + `Orders Web Wave` + `Scheduled Web` | renamed family — intentional |
| `DonutChart` | `Widgets / Graphs / Pie` | renamed family — intentional |
| `TableWidget` | `Tables / * List Widget` | renamed family — intentional |
| `Icon` | — | **intentional addition** |
| `SurfaceCard` | — | **intentional addition** |

**Intentional additions** (not named in the source, added with reason)

* **`Icon`** — a wrapper over the Line Awesome font so consumers never hand-write
  `<i class="las la-…">` or reach for an SVG.
* **`SurfaceCard`** — the white 12px-radius content surface every screen in the source
  draws but the file never names as a component.

### Intentionally skipped families — explicit list

106 of the 251 entries the compiler counts are implemented. The remaining **145 are
intentionally not built as components**, and none is an oversight:

1. **State duplicates of the families above (~52 entries) — now also aliased.** `Badge / Oval`,
   `Badge / Round`, `Buttons / Icon / Outline / Active · Hover · Resting`,
   `Buttons / Icon / Primary / Active · Hover · Disabled · Resting`,
   `Buttons / Plain / …`, `Forms / … / Error · Success · Resting · Active`,
   `Tags / …`, `Progress Bars / …`, `Tabs / …`, `Pagination / …`,
   `Navigation Web / Icons Items / …` are built as `variant` / `tone` / `state` /
   `shape` props on the components listed above — **and each one is additionally
   exported under its exact Figma name** from `components/kit-aliases/`, so nothing is
   unreachable by the file's vocabulary. The props API remains the recommended surface.
2. **Flattened screen symbols (145 entries) — the entire remainder.** *Verified:*
   grepping the source for vector content across these pages returns `data-fig-image`
   on every symbol and no `fontFamily`, `path` or layer data — e.g. `Calendar`,
   `Calendar / Day`, `Calendar / Week`, `Calendar / Event` and their `[Mobile]`
   variants are each a single JPEG fill. Every `Contacts / *`,
   `Projects / *`, `Products / *`, `Files / *`, `Invoices / *`, `Tasks / *`,
   `Kanban / *`, `Messenger / *`, `Notifications / *`, `Reports / *`,
   `Help Center / *`, `Calendar / *` and all `[Mobile]` variants. **Skipped because
   the source contains no vector data for them** — each is a single JPEG fill, so
   there is nothing to transcribe. They are screens, not primitives, and are
   recreated as screens in `ui_kits/markyos-app/`.
3. **Chart and table widgets — now built (~12 entries).** `Counters / Graph / Web`,
   `Graphs / Bars Vertical`, `Graphs / Graph Sidebar`, `Graphs / Orders Web Wave`,
   `Graphs / Scheduled Web`, `Graphs / Single`, `Graphs / Single With Counters`,
   `Widgets / Graphs / Pie`, `Tables / Events List`, `Tables / Invoices List Widget`,
   `Tables / Sales List Widget`, `Tables / Sales Small List Widget` are collapsed into
   `SparkCounter`, `BarGraph`, `LineGraph`, `DonutChart` and `TableWidget` in
   `components/charts/` — read from their vector definitions on the `3. Dashboard`
   page. **Nothing skipped here.**
4. **Kit documentation furniture and the file author's brand (~6 entries).**
   `UI Kit Header`, `CraftUI Logo`, `Fill`, `Icons`, `Line`, `Bg`. **Skipped
   deliberately** — they document the Figma file itself and carry a third-party
   identity that must not enter Markyos.

### Line Awesome — confirmed

`--font-icon` names `Line Awesome Free`, and `tokens/fonts.css` imports
`cdn.jsdelivr.net/gh/icons8/line-awesome@1.3.0/…/line-awesome.min.css`, which **does**
serve that family's `@font-face` rules and binaries. No substitution has been made and
none should be: this is the exact icon font the source file names. The only open item
is vendoring it for offline use, which needs the user to supply the webfont files.

---

## Caveats

* **Lato and Source Sans Pro binaries were not in the source.** They load from Google
  Fonts (Source Sans Pro is served as its successor, **Source Sans 3**). Upload the
  licensed binaries if you need them vendored.
* **Line Awesome loads from CDN** — see Iconography.
* **No avatars, photography or illustrations** could be extracted: they are baked into
  the flattened screen previews. The UI kit uses initial tiles on 10% tints as
  stand-ins and says so.
* The Figma **Variables** collection in the file holds only 7 values (Gray/12, White/1,
  Background/Surface/inverted, Spacing/40, Typography/primary-inverted, …). The real
  token set lives in the `Ui / ColorPalette` and `Ui / Typography` frames and in
  component fills, which is where these tokens were read from.
