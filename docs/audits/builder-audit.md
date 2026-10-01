# Builder audit

**WS1 Task A, `markyos_builder_moodboard_spec.md` §6.1 · 29 September 2026**
(that spec is not in this repository — see `docs/specs/README.md`)

Written for: whoever builds WS2. It describes the builder as it actually is
today, maps every concept onto the block document model, and records the
editor-shell decision with its reasoning.

---

## 1. What `/w/[slug]/builder` does today

### Data

The builder edits two things, and they are not the same shape.

| | Where it lives | Shape |
| :--- | :--- | :--- |
| **Authored sections** | `Workspace.customBlocks`, or `GuidePage.blocks` on a custom page | `PageBlock[]` — flat, with `parentId` + `columnIndex` for nesting inside a `columns` block |
| **Derived sections** | Nowhere. Computed from the brand's own data (logo slots, colours, typography, strategy) | Not stored; `useGuidelineViewer` builds them |

`PageBlock` carries its content inline as named fields (`title`, `arTitle`,
`text`, `arText`, `assetIds`, `videoUrl`, `embedHtml`, `socialLinks`…) rather
than as a props bag. Bilingual text is **two sibling fields**, not a locale map.

Ordering is `order: number` with whole-list rewrites through `reorderBlocks`.

### The flow

`useGuidelineViewer` produces `flowIds: string[]`, which interleaves derived
section ids with `block-<id>` strings and applies `Workspace.sectionOrder`. That
list is the page. Two write paths keep it:

- **Home** writes `sectionOrder`, because derived and authored sections are
  mixed and the derived ones have no row to hold a position.
- **A custom page** writes the blocks' own `order`, because it has nothing but
  blocks and a second ordering mechanism would be a second source of truth.

### Rendering

One renderer, two contexts — the architecture's principle 5 is already true
here. `LiveCanvas` mounts `LiveEditProvider` over the same six template
components `/v/[slug]` mounts bare. `FlowShell` and `BlockShell` (in
`LiveEdit.tsx`) are the wrappers that add selection, drag and the toolbar when
`enabled` is set, and get out of the way when it is not.

### Styling

`BlockStyle` is a small set of *semantic* choices — `align`, `width`, `padding`,
`radius`, `scale`, `background`, `textColor`, `hidden` — resolved to CSS by
`blockStyleCss`. Setting a background re-derives the whole `--g-*` ink ramp for
the subtree (`inkVarsFor`), which is why a section on a brand colour stays
readable without anyone choosing a text colour.

---

## 2. Mapping to the block document model

| Today | Becomes | Notes |
| :--- | :--- | :--- |
| `PageBlock` (kind `columns`) | `Grid` or `Stack` | `columnIndex` becomes a child's slot + `order` |
| `PageBlock` (`text`, `quote`, `stat`, `faq`) | `Heading` + `RichText` in a `Stack` | Each of these is a layout of two or three text fields; as blocks they stop needing their own kind |
| `PageBlock` (`image`, `gallery`) | `AssetRef` | Gallery is `Grid` of `AssetRef` |
| `PageBlock` (`brandLogo`, `brandColors`, `brandType`, `brandIcons`) | `ColorPalette`, `TypeSpecimen`, `AssetRef` | These are *live views* of brand data; as blocks they bind by token id rather than copying values |
| `PageBlock` (`divider`, `spacer`) | `Divider`, `Spacer` | Direct |
| `PageBlock` (`embed`, `form`, `socialLinks`, `video`, `button`) | No converter in the v3.0 cut | They stay `LegacySection` until someone asks |
| Derived sections | `LegacySection` | They are computed, not authored. Converting them to blocks would freeze a live view into a snapshot, which is the opposite of what they are for |
| `title` / `arTitle` | `content.title: { en, ar }` | The one change that matters: a locale map cannot get out of step the way two fields can |
| `order: number` | `order: string` (fractional) | `lib/doc/core/order.ts` |
| `BlockStyle` | `props` + `overrides` | Already done for the existing model — see §4 |
| `sectionOrder` | Root `BlockNode` ordering | Derived sections become `LegacySection` nodes, so the two lists collapse into one |

---

## 3. Gaps against the spec

Measured against the build spec's §7, before this pass:

| Gap | Status after this pass |
| :--- | :--- |
| No layers tree | **Closed.** `components/builder/LayersPanel.tsx`; reorder by button as well as by drag |
| No viewport preview at all | **Closed.** `CanvasFrame` lays out at 1200 / 810 / 390 and scales to fit |
| No breakpoint overrides | **Closed** for section style — see §4 |
| No direction overrides | **Closed** for section style; `[dir="rtl"]` rules are emitted |
| No structural-edit rule for secondary views | **Partly.** `lib/doc/core/rules.ts` implements and tests it; the builder shows the banner and scopes its writes, but the existing `PageBlock` model has no server to enforce against — that is WS4 |
| No `Op[]` write path | **Not started.** `lib/doc/core/ops.ts` exists and is tested; nothing calls it yet |
| No block registry | **Not started** |
| Layout primitives (Stack/Grid, Fit/Fill/Fixed) | **Not started.** The sizing model is specified and tested in `lib/doc/css/emit.ts` |
| Missing-translation counter | **Shipped for the model that exists**, not for this one. `lib/pageReview.ts` reports bilingual gaps over `PageBlock` and the builder shows them beside Publish; `resolve.ts`'s own `missing` report is still read by nothing, and becomes the counter's source when `BlockNode` becomes the storage format |

---

## 4. What shipped in this pass, and why it is not WS2

The document core (`lib/doc/core/*`, `lib/doc/css/emit.ts`) is complete and
tested — 85 unit tests covering the resolution cascade, RTL defaults against
explicit overrides, secondary-view rules, cycle rejection, delete/undo
round-trips, 1,000 random fractional inserts, and byte-identical CSS output.

It is **not yet the storage format.** Rebuilding the builder onto `BlockNode`
means rewriting `LiveCanvas`, all six templates and the two publish paths in
one change, and the spec's own guardrail is that the six published templates
must never break. So this pass took the cascade — the part with the visible
user benefit — and applied it to the model that exists:

- `BlockStyle` gained `bp: { tablet, phone }` and `rtl`, the same shape as
  `Overrides` and resolved by the same rules (`resolveStyle` in
  `lib/blockStyle.ts` mirrors `resolveProps` in the core).
- Because inline styles cannot express a media query, `blockStyleRules` emits
  real `@media` and `[dir="rtl"]` rules **through the core's emitter**, so the
  logical-property guarantee and the deterministic output apply to them too.
- The inspector writes into whichever scope the current view owns, shows a dot
  where a field differs elsewhere, and offers a reset — Figma Sites' behaviour,
  which is the one that does not require holding the storage format in your head.

The consequence worth stating: **people learn the cascade now, on the model that
exists, and WS2 changes what is underneath rather than how it behaves.**

---

### Added 1 October 2026, from the Framer teardown

Three gaps that were not on the list above, because the spec this audit was
written against did not name them:

| Gap | Status |
| :--- | :--- |
| Undo with no redo | **Closed.** `redo` / `canRedo` in `lib/store.tsx`, `Ctrl+Shift+Z` and `Ctrl+Y`, redo branch cleared by a fresh edit |
| No feedback loop — the editor could say what a page *was*, not what was wrong with it | **Closed.** `lib/pageReview.ts` (pure, 29 tests) surfaced as a chip beside Publish; clicking a finding reveals its section |
| Selecting a section from outside the canvas did not reveal it | **Closed.** `data-flow-id` on both editing shells, read by the review panel and the layers tree |
| One layout per derived section — a palette could only ever be swatch cards | **Closed.** `lib/sectionVariants.ts` + `SectionLayouts.tsx`; 19 layouts across 6 sections, resolved inside `FixedSectionBody` so all six templates pick them up unedited |

The teardown agrees with §5 below on the shell question and adds nothing to it.
Two of its recommendations are refused on purpose: a `<canvas>`/WebGL editor, and
a free-CSS property model in place of `BlockStyle`'s semantic one — see the
changelog entry for the reasoning, which is the bilingual argument in both cases.

---

## 5. Editor shell: recommendation

**Extend the existing builder. Do not adopt Puck.**

The spike in the build spec's §6.2 was not run, and this is a decision made on
the written decision rule plus what the audit found, so it should be revisited
if anyone disagrees. The reasoning:

1. **Question 1 of the decision rule is already answered, by us.** "Can the
   same component serve edit and published?" — it does, today, through
   `LiveEditProvider`. Puck would be replacing a working answer to its own
   hardest question.
2. **Question 5 is the risk.** The editor must work under `dir="rtl"`: drag
   handles, drop indicators, panels. Our own chrome is already written in
   logical properties and mirrors; an external editor shell is an unknown
   quantity there, and RTL correctness is not a thing to find out late.
3. **Question 2 is the cost.** Puck data would be an adapter format, converted
   both ways on every load and save. That conversion is a place for the two
   representations to disagree, permanently, for a shell we would be wrapping
   anyway.
4. **The six templates are page chrome, not editor chrome.** Puck's value is
   its canvas and inspector; the templates supply the frame, the type scale and
   the navigation, and blocks fill the body. The part Puck would bring is the
   part we have.

What we should take from Puck regardless, and have: one registry, one renderer,
data-driven fields, and a strict separation between the editor shell and the
document model. `lib/doc/*` is ours either way — that part of the decision rule
holds whichever way the shell goes.

---

## 6. Open, for whoever picks up WS2

- **Primary locale per workspace.** `Workspace.lang` is being used as the
  primary locale by `rules.ts` today. The spec wants it chosen at creation and
  changeable by the Owner; right now it is the same field that switches the
  admin UI language, and those are two different ideas sharing a field.
- **`ContentBlock.position` stayed `Int`.** Every *document* ordering moved to
  fractional keys; the legacy section table did not, because legacy sections are
  not concurrently reordered by a room. Revisit if that stops being true.
- **The `Reveal`, `Decoration` and `LogoClearspace` blocks** are specified and
  not built.
