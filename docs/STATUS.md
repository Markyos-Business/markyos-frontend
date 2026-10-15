# Markyos — development status

**As of 15 October 2026.** `HEAD` is `311cbc3`, plus six files of verified but
uncommitted editor-shell work (listed in §11).

Written as the starting point for planning the next version. Everything below
was read out of the codebase rather than recalled, and counts were taken
programmatically. Where something is specified but not built, it says so.

---

## 1. At a glance

| | |
| :--- | :--- |
| Stack | Next.js 16.3.4 (App Router, Turbopack), React 19.2.8, TypeScript strict, Tailwind v4 |
| Runtime deps | `next`, `react`, `react-dom`, `stripe`, `zod`, `mammoth` (.docx), `pdfjs-dist` |
| Size | ~59,900 lines across `app` (30 files), `lib` (67), `components` (87), `scripts` (17) |
| Persistence | **Browser only.** `localStorage["markyos:v1"]` + IndexedDB for file payloads |
| Server | None, except one Stripe Checkout route |
| Database | Prisma schema with **36 models, no migrations generated** |
| Tests | 252 unit tests, 12 files |
| Browser sweeps | 13 suites, 113 named `ok` assertions + 4 measurement suites |
| Static gates | 4 (logical properties, token contract, icon names, contrast) |
| Git history | 7 commits. **The project's real history is `docs/CHANGELOG.md`** (1,403 lines) |

The single most important fact for planning: **this is a complete, working
client-side prototype with no backend.** It is not a half-built product — it is
a fully-built product whose storage layer is a browser tab. Every feature below
genuinely works today, for one person, in one browser, with no sharing between
devices.

---

## 2. Routes

### Public / unauthenticated

| Route | What it is |
| :--- | :--- |
| `/` | Marketing landing |
| `/login`, `/signup`, `/reset` | Account entry. Passwords are PBKDF2-SHA256, 210k iterations, per-password salt |
| `/v/[slug]` | **The client's guideline site.** Optional password gate |
| `/v/[slug]/p/[page]` | A custom page of that site |
| `/s/[token]` | A scoped share link — strategy or one department |
| `/b/[token]` | A client brief, filled in by the client |

### Studio

| Route | What it is |
| :--- | :--- |
| `/brands`, `/brands/new` | Brand gallery and creation |
| `/templates` | Starter brands to clone |
| `/studio/board` | Every brand by lifecycle stage. Deliberately *not* a CRM |
| `/account` | Profile and billing |

### Per brand — `/w/[slug]/…`

`overview`, `brief`, `strategy`, `visual-identity`, `type-lab`, `moodboard`,
`departments`, `compliance`, `drafts`, `team`, `settings`, `builder`.

### API

`POST /api/checkout` — real Stripe Checkout session (test mode) for the $19
Project Pass or the Studio subscription. **There is no webhook**: the client
marks the plan purchased on redirect, because there is no database for a webhook
to write to. This is the one place the prototype trusts something it shouldn't,
and it is flagged in the route's own comment.

---

## 3. The guideline site — what a client receives

### Templates

Six templates, and `studio` has three distinct sub-styles, so **eight distinct
looks**:

| Template | Character |
| :--- | :--- |
| `vault` | — |
| `docs` | — |
| `studio` · `signal` | Dark, one continuous scroll, numbered chapters, hamburger nav, floating download CTA |
| `studio` · `atlas` | Fixed auto-expanding accordion sidebar, full-bleed numbered colour-band hero per section |
| `studio` · `prism` | Centred floating pill nav, full-bleed gradient hero, bracket eyebrow labels |
| `manual` | — |
| `mosaic` | — |
| `deck` | Slide-based. **Does not call `FixedSectionBody`**, so per-section layouts don't reach it — the inspector shows an `inert` notice rather than failing silently |

Each supplies page chrome: the ground, the navigation, the type scale, how a
section is framed and numbered.

### Sections

**16 derived sections** appear automatically when their data exists, in
`lib/useGuidelineViewer.ts`:

`overview`, `statement`, `strategy`, `logo`, `misuse`, `app-icon`, `color`,
`typography`, `mockups`, `photography`, `patterns`, `icons`, `social`,
`personas`, `voice`, `departments`

The conditions live in one place so templates ask `showSection(id)` instead of
re-deriving them — five templates each deciding whether a logo section exists is
how they drift apart. Sections can be renamed (bilingually), annotated,
reordered, hidden, or *parked* (kept on the canvas, left off the published site).

### Per-section layouts — 19 across 6 sections

`lib/sectionVariants.ts`. The first entry of each list is the default and is the
layout that section already had, so **nothing changes for an existing guideline
until somebody picks something**.

| Section | Layouts |
| :--- | :--- |
| `color` | Swatch cards · Full-width bands · Dense chips · Primary featured |
| `logo` | Full system · Lockups only · Primary showcase |
| `typography` | Specimen · Size table · Poster |
| `photography` | Even grid · Lead image · Full-width rows |
| `icons` | Tiles · Named tiles · Dense set |
| `mockups` | Two up · One up · Three up |

Two rules every layout keeps: it reads brand data **live** (never stores a copy,
so adding a colour updates all four palette layouts), and it styles itself from
`--g-*` tokens, so it inherits whichever template is active — a band layout is
square and shadowed under Signal and round and filled under Atlas from the same
component. `scripts/token-contract.mjs` enforces this.

### Per-section options

`lib/sectionOptions.ts` — control over the *parts* of a section, not just its
preset:

| Section | Options |
| :--- | :--- |
| `color` | Which value formats print (HEX/RGB/HSL/CMYK), names on/off, click-to-copy, columns (2–6) |
| `typography` | Scripts (both/Latin/Arabic), character set, size scale, the sample sentence in each language |
| `logo` | Clearspace drawing, colour variations, columns (1–4) |
| `photography` | Columns (2–4), framing (square/landscape/wide/original) |
| `icons` | Columns (4/6/8/10) |
| `mockups` | Columns (1–3), captions |

`resolveOptions` returns only the keys a section offers, and distinguishes
"unset" (fall back) from `[]`/`false`/`""` (a real choice) — so turning *every*
colour format off is a thing you can do.

### Custom blocks — 19 kinds, 6 categories

`lib/blockCatalog.ts`. One registry shared by the sidebar palette and the
on-canvas `+` menu, so the two cannot offer different sets.

- **Brand** — `brandLogo`, `brandColors`, `brandType`, `brandIcons`, `files`.
  Live views of the workspace's own design-system data. Edit a colour anywhere
  in the app and every placed block updates; nothing to keep in sync by hand.
- **Text** — `text`, `quote`, `stat`, `faq`
- **Media** — `image`, `gallery`, `video`
- **Layout** — `columns` (nests children), `divider`, `spacer`
- **Forms** — `form`, `button`
- **Social** — `socialLinks`, `embed`

### Styling model — `BlockStyle`

Deliberately a **small set of semantic choices, not free CSS**:

`variant`, `align` (`start`/`center`/`end`), `scale` (0.75–1.75, applied as
`zoom` so it reflows rather than overlaps), `textColor`, `background`,
`padding`, `radius`, `width` (`narrow`/`wide`/`full`), `hidden`, plus
`bp: { tablet, phone }` and `rtl`.

Two decisions here are load-bearing and should survive any rewrite:

1. **`start`, never `left`.** The site ships bilingually; absolute positions and
   physical sides mirror wrongly in Arabic. `scripts/no-physical-props.mjs`
   enforces it across the codebase.
2. **Desktop-first cascade.** A key set at a breakpoint says "at this width,
   instead"; an unset key keeps following the base value, so changing the
   desktop design still reaches the phone. Storing a complete value set per
   breakpoint is the alternative, and it is how a brand book ends up with a
   phone layout from two redesigns ago.

### Breakpoints are container queries

**`@container g-page`, never `@media`.** This was a live bug for some time: the
editor lays the page out in a 390px-wide element scaled down inside a 1400px
window, so a `@media (max-width: 809px)` rule was false on the canvas and a
phone override did nothing. Declared on `[data-guideline-surface]` in
`app/globals.css`; a unit test forbids `@media` and a sweep check measures
rendered height rather than rule text.

### One renderer, two surfaces

`LiveCanvas` mounts `LiveEditProvider` over the same template components that
`/v/[slug]` mounts bare. **The canvas and the published page are the same
code** — this is the hardest question an editor has to answer, and it is already
answered. It is the main reason the builder audit recommends extending the
existing builder rather than adopting Puck.

---

## 4. The editor — `/w/[slug]/builder`

A **focused mode**: the studio's navigation rail is not rendered, the app top bar
is gone, and publishing floats in the canvas's own corner. The page being
designed gets **85% of the window** (it was 51%). The sweep asserts the *share*,
not the presence of any particular element, because the share is what matters.

- **Layers tree** with drag-reorder and button-reorder
- **Viewport frames** at 1200 / 810 / 390, scaled to fit; the frame always lays
  out as though the widest panel were open, so opening the inspector does not
  resize the page
- **Tabbed inspector** — Content / Style / Layout. Writes into whichever scope
  the current view owns, shows a dot where a field differs elsewhere, offers a
  reset. (Figma Sites' behaviour, which is the one that doesn't require holding
  the storage format in your head.)
- **Page review** — `lib/pageReview.ts`, a pure deterministic linter, surfaced as
  a chip beside Publish. Clicking a finding scrolls its section into view.
  Severity follows the renderer's own fallback: missing Arabic is a warning,
  missing English is an error. Untranslated fields collapse into one counted row
  rather than one row each.
- **Undo and redo** — `Ctrl+Z`, `Ctrl+Shift+Z`, and `Ctrl+Y` for the Windows
  hand. A fresh edit drops the redo branch.
- **Insertion gaps** between every section, opening on hover without moving the
  page

---

## 5. The rest of the platform

Each of these is built and swept.

- **Brief** (`/w/[slug]/brief`, client side at `/b/[token]`) — three templates
  (new brand / rebrand / sub-brand), typed questions (text/long/choice/scale),
  statuses `draft → sent → in_progress → submitted`. 33 sweep checks.
- **Strategy** — vision, mission, purpose, positioning, personas, voice traits,
  core values, competitors. Bilingual throughout, with machine translation via
  MyMemory written in as an **editable draft flagged for review**, never
  rendered as authored copy.
- **Visual identity** — logo slots (Arabic / Latin / symbol) with upload phases,
  clearspace, download panel; colour palette with extraction from a logo;
  typography; brand files.
- **Type lab** — typographic scale work.
- **Moodboard** — DOM + CSS transform canvas (not WebGL), 8 typed zones
  (`imagery`, `palette`, `type`, `texture`, `words`, `references`, `unsorted`,
  `custom`), k-means colour extraction from real pixels, spatial culling so only
  cards near the window render. **Positions are derived** — the canvas computes
  every position and only what someone dragged is stored. 44 sweep checks.
- **Drafts** — every machine or ingestion proposal lands here rather than in the
  brand. Sources: `brief`, `ai`, `ingestion`, `palette`; statuses `pending →
  accepted / rejected / superseded`, with provenance. 21 sweep checks.
- **Departments** — per-department instruction documents, publishable to the
  site, importable from .docx/PDF.
- **Compliance** — asset colour checking and a copy linter. (`lib/copyLint.ts`
  carries one planned-but-unbuilt item: a model-based tone-of-voice check.)
- **Team & approvals** — roles `owner` / `editor` / `viewer` / `client`,
  approval requests, sign-off pins on four sections.
- **Sharing** — password gate, custom subdomain (separate from `slug`, because a
  slug must stay stable and a public address is one the studio picks), custom
  domain with status, scoped share tokens.
- **Billing** — free / Project Pass / subscription, real Stripe test-mode
  checkout, white-label flag.
- **Version history** — `VersionSnapshot[]` on the workspace.
- **Publishing** — `published: PublishedSnapshot | null`, a full `Omit<Workspace,
  "published" | "publishedAt">`. Publish is all-or-nothing for the whole brand.

---

## 6. Data model and persistence

One React context — `AppProvider` / `useApp()` in `lib/store.tsx` — over a
single `Workspace` object with **50 top-level fields**. Every mutation rewrites
state in memory; one effect persists the result.

`lib/repository.ts` already defines a `BrandRepository` interface so the store
no longer knows *where* it stores things. Two implementations are planned; one
exists:

- **`LocalAdapter`** (today) — `localStorage` + IndexedDB. It carries every
  hydration backfill, because those exist to repair *this storage format*: a
  browser whose saved snapshot predates a field has to be repaired on read.
- **`ServerAdapter`** (not written) — Server Actions, Prisma, R2. Needs no
  backfills: the database has the columns because a migration added them.

The interface is snapshot-shaped on purpose, which mirrors what the prototype
genuinely does. **When `ServerAdapter` lands, `save` cannot stay** — you do not
PUT the universe over HTTP. It splits into `createWorkspace`, `updateSection`,
`putAsset`, `publish`, `createShareLink`.

### The three-place invariant (a real trap)

Every new `Workspace` field must be added in **three places**, and `mockData.ts`
counts twice:

1. the hydration backfill in `lib/adapters/localAdapter.ts`
2. `createWorkspace` in `lib/store.tsx`
3. `lib/mockData.ts` — **both** the Nadeen seed *and* the `brand()` factory

Miss one and the failure is silent in development and visible only to a user
with an older snapshot. This disappears the moment storage becomes a database,
and that is one of the better arguments for doing the server work.

### The document core — built, tested, not the storage format

`lib/doc/core/*` and `lib/doc/css/emit.ts` are complete: **86 unit tests** today
(the builder audit says 85 — it was written before the last one landed) covering
the resolution cascade, RTL defaults against explicit overrides, secondary-view
rules, cycle rejection, delete/undo round-trips, 1,000 random fractional
inserts, and byte-identical CSS output.

It is **not what the app stores.** Moving to `BlockNode` means rewriting
`LiveCanvas`, all six templates and both publish paths in one change, and the
guardrail is that the six published templates must never break. So this pass
took the cascade — the part with visible user benefit — and applied it to the
model that exists. The consequence worth stating: **people learn the cascade
now, and the eventual migration changes what is underneath rather than how it
behaves.**

### Prisma

36 models, schema written, **no migrations generated**, `DATABASE_URL` and
`SHADOW_DATABASE_URL` present in `.env`. Nothing in the app reads from it.

---

## 7. Quality apparatus

This is unusual enough to be worth protecting in any replan. It is also the
reason the status above can be stated as fact.

**252 unit tests** in 12 files:

| Tests | File |
| ---: | :--- |
| 52 | `lib/doc/core/doc.test.ts` |
| 29 | `lib/pageReview.test.ts` |
| 25 | `lib/moodboard/layout.test.ts` |
| 22 | `lib/auth.test.ts` |
| 21 | `lib/doc/css/emit.test.ts` |
| 20 | `lib/blockStyle.test.ts` |
| 19 | `lib/contrast.test.ts` |
| 15 | `lib/sectionOptions.test.ts` |
| 13 | `lib/doc/core/order.test.ts`, `lib/moodboard/kmeans.test.ts`, `lib/sectionVariants.test.ts` |
| 10 | `lib/utils.test.ts` |

**13 Playwright sweeps** that drive the real UI (`npm run sweep`):

| Sweep | Scale |
| :--- | :--- |
| `builder` | 62 checks |
| `moodboard` | 44 checks |
| `brief` | 33 checks |
| `drafts` | 21 checks |
| `persistence` | 16 checks |
| `board` | 14 checks |
| `assets` | 12 checks |
| `modals` | 7 checks |
| `responsive` | 32 combinations (8 templates × en/ar × phone/tablet) |
| `interaction` | 30 renders, 994 elements sized, 817 hovered, 721 focused |
| `surfaces` | 28 renders, 110 surfaces, 32 images |
| `contrast` | rendered contrast across all alternate layouts, both themes |
| `bidi` | reversed Latin/numeric runs in Arabic |

**4 static gates:** `audit:logical` (no physical properties), `audit:tokens`
(every `--g-*` a template consumes is provided), `audit:icons` (every icon asked
for is drawn), `audit:contrast`.

### The lesson these encode

Repeatedly, through this project's history, **a check asserting on an artefact
passed while the behaviour was broken.** The `@media` breakpoint bug survived
because every assertion was about the rule *text*. It was found by measuring a
rendered element's height. The working rule now: assert on what the user gets,
and deliberately break each new check and watch it go red before trusting it.

Contrast standard: brand surfaces get AA (4.5:1); app chrome gets 7:1 under
12.5px, enforced by `[data-guideline-surface]` in the contrast sweep.

### Known weakness in the apparatus

A dead dev server and a genuinely broken page produce the **identical** sweep
error (`page looks empty`). Diagnosing one as the other costs real time. Reading
the HTTP status before measuring content would separate them in one line. Worth
adding.

---

## 8. Invariants any new plan must respect

These are not style preferences; each was arrived at by hitting the problem.

1. **Bilingual is structural, not a translation layer.** Arabic and English are
   peers. This is why `BlockStyle` is semantic, why physical properties are
   gated, why the workspace shell sets `dir` twice (the document root for toasts
   and dialogs, the wrapper for everything inside), and why every label in the
   registries carries an `arLabel`.
2. **Container queries, not media queries**, anywhere inside the guideline
   surface.
3. **One renderer for canvas and published page.** Do not fork them.
4. **`FixedSectionBody({id, ctx, overrides})` is the single seam** every template
   calls for derived sections. A chosen layout outranks a template's own body;
   on the default, the template's body comes back. Both directions are swept —
   it was silently wrong in 2 of 6 templates first time.
5. **Layouts read brand data live.** No layout stores a copy of anything.
6. **Ink on a brand colour is never faded.** Faded 9px labels on a brand colour
   measured 3.76:1 in both themes. Fixed as a rule, not a number.
7. **Machine output lands in Drafts**, never directly in the brand.
8. **`--hairline-strong` is the card edge.** A fill step cannot separate cards on
   the dark theme; the boundary is a line, and it is gated.
9. **Never script file rewrites on this codebase.** A scripted PowerShell replace
   once read UTF-8 as CP1256 and mojibaked the Arabic in all five template
   files. Edit files individually.

---

## 9. Deliberately refused

Worth recording so they are not re-proposed as oversights:

- **A `<canvas>`/WebGL editor** (Framer teardown). The bilingual argument: text
  layout, direction and font fallback are the browser's job.
- **Free-CSS property model** in place of `BlockStyle`'s semantic one. Same
  argument — absolute positions mirror wrongly.
- **Puck** as the editor shell. Four reasons in `docs/audits/builder-audit.md`
  §5; the strongest is that Puck's hardest question (can one component serve
  edit and published?) is already answered here.
- **Canva's `rotation`** on moodboard items — belongs to a design tool, not a
  board of reference photographs.
- **A deeply-nested scene graph** — warned against in Canva's own spec text for
  complicating CRDT sync. Zones here are regions decided by geometry on drop,
  not DOM parents.
- **Markyos as a CRM.** Leads, deals, proposals and invoicing stay in whatever
  the studio already pays for. Markyos owns the brand's lifecycle, not the
  agency's business — a per-seat agency tool would contradict the client-pays
  model.

---

## 10. Gaps and open items

### Blocked on provisioning, not on code

Needs Postgres, R2, a deploy target, a Better Auth secret:

- Server persistence (`ServerAdapter`) — and with it, the end of the three-place
  invariant and of hydration backfills
- Real-time collaboration (Yjs CRDTs, `y-websocket`, awareness protocol for live
  cursors, Redis for ephemeral session state)
- Version history as a real feature rather than an array
- Per-page publish (today publish is all-or-nothing per brand)
- A Stripe webhook, so purchase is confirmed rather than trusted
- Multi-device anything. Today a brand exists in one browser

The data model is **not far off** what the collaboration specs assume: a board is
already a flat list of nodes carrying absolute coordinates and a size, which is
the shape a `Y.Array` of nodes wants.

### Not started, no blocker

| Item | Note |
| :--- | :--- |
| `Op[]` write path | `lib/doc/core/ops.ts` exists and is tested; nothing calls it |
| Block registry | From the build spec §7 |
| Layout primitives (Stack/Grid, Fit/Fill/Fixed) | Sizing model specified and tested in `lib/doc/css/emit.ts` |
| `Reveal`, `Decoration`, `LogoClearspace` blocks | Specified, not built |
| Tone-of-voice check | `lib/copyLint.ts` — the first thing here that would use an LLM |

### Open design questions

- ~~**Primary locale vs. admin UI language share one field.**~~ **Closed, 16 Oct
  2026.** `Workspace.primaryLocale` is the brand's language; `Account.adminLang`
  is the person's, and `null` falls back to the brand so nothing changed on its
  own. What remains: the spec wants the primary locale **changeable by the
  Owner**, and the only control that sets it today is the preview toggle on
  Overview. It belongs in Settings.
- **`ContentBlock.position` stayed `Int`** while every document ordering moved to
  fractional keys, because legacy sections are not concurrently reordered by a
  room. Revisit if that stops being true.
- **Deck cannot take per-section layouts** — it never calls `FixedSectionBody`.
  Either give it the seam or keep the `inert` notice.

### Offered and not yet decided

From the guidelines.site teardown, each a real piece of work:

- Contextual popover inspector replacing the permanent 300px column (§3.1)
- Cyan selection frame with 8 resize handles (§3.7)
- Section action bar, bottom-start (§3.7)
- Fluid `clamp()` typography (§4.4)
- Viewer-side Inspect mode (§3.11)

---

## 11. Uncommitted right now

Verified green — typecheck, 252 tests, lint, all four static gates, full 13-sweep
suite — but not committed:

```
app/w/[slug]/builder/page.tsx
app/w/[slug]/layout.tsx
components/builder/CanvasFrame.tsx
components/workspace/Sidebar.tsx
docs/CHANGELOG.md
scripts/sweeps/builder.mjs
```

This is the editor-shell restructure described in §4 (51% → 85% of window).

---

## 12. Running it

```bash
npm run dev        # http://localhost:3000
npm test           # 252 unit tests, ~2s
npm run check      # typecheck + lint
npm run sweep      # all 13 browser sweeps — needs the dev server up
```

Test login: `nadeen@studio.com` / `markyos2026`. Client viewer password:
`nadeen2026`.

Two operational notes:

- If the editor or viewer goes blank while `/` and `/login` still work, look for
  `Jest worker encountered 2 child process exceptions` in the dev-server output.
  Next.js's compile worker pool has died; already-compiled routes keep serving
  while anything needing fresh compilation 500s. Restart the server.
- `AGENTS.md` opens with "This is NOT the Next.js you know" and is **re-added by
  `next dev`** — removing it from a diff just recreates the change. Read
  `node_modules/next/dist/docs/` before writing framework code.

---

## 13. Where the real documentation is

| File | What it holds |
| :--- | :--- |
| `docs/CHANGELOG.md` | 1,403 lines. What shipped and **why** — every decision, every bug and how it was found. With 7 git commits, this is the project's actual history |
| `docs/audits/builder-audit.md` | What the builder does, the gap table against the spec, the Puck decision, WS2 open items |
| `docs/specs/README.md` | Points at the two governing specs, which are **not in this repo** — the Rev 2.1 roadmap and the builder/moodboard spec |
| `scripts/sweeps/README.md` | How the sweeps work |
| `AGENTS.md` | The Next.js warning |

The two governing specs are referenced rather than checked in, on purpose: a
spec that exists in two places drifts, and the copy that drifts is always the one
somebody reads. Where they disagree, the roadmap wins on scope and timing and the
build spec wins on implementation detail.

**Anyone picking up a workstream needs both in hand**, because the audits and
changelog cite them by section number.

---

## 14. If I were writing the next plan

Offered as a reading of the above, not as a decision.

**The one thing holding everything back is provisioning.** Six of the most
valuable remaining features are one Postgres instance and one R2 bucket away
from being buildable, and the adapter seam they need already exists. Nothing
else on this list unlocks as much.

A plausible order:

1. **Provision** — Postgres, R2, deploy target, auth secret. Not a coding task.
2. **`ServerAdapter`.** Generate the migrations the 36-model schema already
   implies, widen `BrandRepository` from snapshot-shaped to the five entity
   operations it names, keep `LocalAdapter` working behind the same interface.
   This kills the three-place invariant and every hydration backfill.
3. ~~**Split `Workspace.lang`**~~ — done, 16 Oct 2026. What is left of it is a
   Settings control so an Owner can change the brand's locale.
4. **Real publish** — per page, with a Stripe webhook confirming purchase
   against a row instead of a redirect.
5. **Then** choose between collaboration (Yjs, the specs' main subject) and the
   `BlockNode` migration. Both are large; doing either well probably excludes
   doing the other at the same time.

Two things to protect while doing any of it: the sweeps (they are why these
claims can be stated as fact), and the bilingual invariants in §8 — those are
the hardest part of this product to retrofit and the easiest to lose in a
rewrite.
