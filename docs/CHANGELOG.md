# Changelog

What shipped, and the decisions taken along the way. Required by the build
spec's definition of done (§15).

---

## 2026-10-16 — The brand's language and the reader's are two different things

`Workspace.lang` was one field doing two unrelated jobs, and Revision 3.2 §21.1
asks for it split before any real data depends on the conflation. It now is:

- **`Workspace.primaryLocale`** — the brand's own language. What `/v/<slug>`
  opens in, what the canvas previews, what `lib/doc/core/rules.ts` resolves the
  bilingual fallback against, and what makes a value missing in that language an
  error while the same gap in the other language is only a warning.
- **`Account.adminLang`** — the person's interface language, `Lang | null`.

What the single field cost: a studio in Riyadh building an English brand had to
work in English chrome, and switching the chrome to Arabic quietly changed what
the client saw and which half of every bilingual field counted as authoritative.

### The interface already claimed this split existed

The top bar's control is labelled **"Interface language" / "لغة الواجهة"**, with
`scope="chrome"` to distinguish it from the canvas's preview switch. It wrote
`workspace.lang`. The label had been promising a personal setting while the
field changed the brand. It now sets `adminLang` and does what it says.

The Overview control went the other way: its own toast reads "Switched preview to
Arabic", so that one was always about the brand, and it now calls
`setPrimaryLocale`.

Changing your interface language also stopped counting as editing a brand —
`setAdminLang` does not go through `mutateWorkspace`, so it touches no
workspace's `updatedAt`. Before the split it did.

### `null` is the part that makes this safe

`uiLang(ws)` returns `account.adminLang ?? ws.primaryLocale`. A person who has
stated no preference reads the app in whatever language the open brand is in,
which is exactly what the single field did — so no existing browser renders
differently until somebody chooses. Same shape as the first-entry default in
`sectionVariants.ts`: the migration is inert until used.

The hydration backfill reads the old `lang` name as the source for
`primaryLocale`, because treating it as a missing field would have reset every
Arabic brand in an existing browser to English.

### Classifying 51 call sites, not renaming them

38 were studio chrome, 6 were the brand's locale, and 4 were `Brief.lang` — a
different field holding the language a respondent chose, left alone.
`tsc --noEmit` enumerated every site, so the split was driven by the compiler
rather than by eye.

`uiLang` is a plain function on the context rather than a hook, because several
call sites need it inside JSX and inside `.map()`.

### Two bugs found while verifying, both in the verification

**`uiLang` read through `stateRef` first.** That returns a stable function
identity, so it would have given the right answer forever and never caused
anyone to ask for it again — choosing a language would have silently repainted
nothing. It now derives from `state` and lists that as a dependency.

**The new sweep check reported a leak on a page that was behaving perfectly.**
It asked whether anything inside the canvas was `dir="rtl"`. An English brand
still publishes its Arabic typeface, so the type specimen sets `dir="rtl"` on
the character set (`ا ب ت ث ج`) and the sample sentence regardless of the page's
language. The question is what direction the *page* is laid out in, and only the
surface element answers it. Measured properly: `htmlDir=rtl` with
`surfaceComputedDir=ltr`, 4,701 Latin characters against 135 Arabic.

Three checks added to the builder sweep (59 → 62). One of them is sensitive to
collapsing `uiLang` back to a single field, which was confirmed by doing it and
watching it go red; the other two guard the opposite direction and the fallback.
Every other check in the suite passes whether the fields are separate or not,
which is how a field ends up doing two jobs twice.

Revision 3.2 §10 item 5, and §3.3's second trap.

---

## 2026-10-15 — Revision 3.2 becomes the plan, and the sweeps learn to read a status code

Two things, and the second one exists because of a diagnosis the first one
asked for.

### The plan of record

Revision 3.2 of the architecture roadmap (15 Oct 2026) is now the plan, saved
beside rev2 outside this repository and pointed at from `docs/specs/README.md`.
Revision 2.1's row stays, marked superseded, because older audits and changelog
entries cite it by section number and those citations have to keep resolving.
Section numbers are revision-specific — §7 is one-sided pricing in 2.1 and
two-sided in 3.2 — so citations should name the revision when it matters.

`docs/STATUS.md` is the measured build state the revision was checked against.
Writing it caught two numbers that were wrong from memory: `Workspace` has 50
top-level fields, and the document core has 86 tests rather than the 85 the
builder audit records.

The revision's own MVP item 2 was "commit the six verified editor-shell files
and repoint the specs README", which is what the two commits before this entry
do.

### A dead server was indistinguishable from a broken page

Running the full sweep against the plan turned up `vault · en · phone: page
looks empty (0 chars, 34 elements)`. That reads like a broken template. It was
not: the dev server was returning 500.

The cause is worth recording, because it was self-inflicted and it will happen
again. The server had been started with its output piped to a process that was
later killed, so every log write threw `write EPIPE`. Those uncaught errors
accumulated listeners on the stream — `MaxListenersExceededWarning: 11 unpipe
listeners added to [SyncWriteStream]` — and eventually took the compile worker
pool with them:

```
Error: Jest worker encountered 2 child process exceptions, exceeding retry limit
```

**A half-dead Next.js dev server looks healthy to a quick check.** Routes that
were already compiled keep being served from the dev cache, so `/` and `/login`
answered 200 throughout, while `/w/<slug>/builder` and `/v/<slug>` — the two
routes that need fresh compilation, and the only ones the sweeps care about —
both served 500. A five-route curl check reported four of five fine.

### Why every assertion missed it

Same shape as the `@media` bug: **the sweeps asserted on the DOM, and a 500
error page has a DOM.** The status code was never read by anything.

The consequence is worse than a misleading message. Several sweeps *pass*
against an error page, because their findings are things that are absent from
it:

| Sweep | What it looks for | On a 500 page |
| :--- | :--- | :--- |
| `surfaces` | a card that does not separate from its background | no cards, so none fails |
| `bidi` | reversed Latin runs inside Arabic | no Arabic, so none reversed |
| `interaction` | an unreachable control, a missing focus ring | no controls |
| `modals` | a panel that will not close on Escape | no panels |
| `asset-status` | an exploration asset reaching a public surface | the public surface did not render |

A green run against a dead server is the worst outcome available here, and four
sweeps could produce one.

### `scripts/sweeps/serverGuard.mjs`

Two entry points, because the two failures arrive at different times.

`assertServerUp(BASE, [heavyRoutes])` runs before Playwright launches and
refuses to start a run the result of which could not mean anything. It is given
each sweep's own heavy client-rendered routes rather than just `/`, precisely
because the cheap routes are the ones that stay up. All 13 sweeps call it.

`installServerGuard(page)` watches main-frame document responses for the rest of
the run, for a server that dies partway. Its `check()` has to be called *before*
the DOM is measured, or the misleading message gets there first — in
`responsive.mjs` it is the first line of `assertGuidelineRendered`, above the
code that produced the original message.

Proven by standing up three fake servers: nothing listening (red), a half-dead
one serving `/` at 200 and `/v/x` at 500 (red, and it names the asymmetry), and
a healthy one (green, no false alarm). Then end to end, by stopping the real dev
server and running a sweep: exit 1, with the actionable sentence first instead of
`page looks empty`.

Revision 3.2 §10 item 12, and §3.3's third trap.

---

## 2026-10-01 (fifth pass) — The editor shell, after guidelines.site

"I don't see any updates — it still looks like Framer, not guidelines.site."

The controls from the fourth pass were all present and working; a screenshot of
the editor confirmed the layout picker, the Content/Style/Layout tabs and the
per-part options rendering correctly. What was wrong was the **shell**. Markyos
wrapped the canvas in four columns of chrome — studio navigation, tools panel,
app top bar, inspector — and the page being designed got **51% of a 1600px
window**. That is Framer's shape. guidelines.site has one sidebar and a canvas,
with everything else floating (teardown §3.3).

Three changes, all about the same number:

**The editor is a focused mode.** The studio's own navigation is not rendered on
`/builder`. Every other page here is a form or a list and the sidebar costs it
nothing; the editor is a canvas, and that rail was the fourth column around it.
It carries its own way back out instead — a full-screen mode with no visible
exit is a trap, however much canvas it buys.

**The app top bar is gone.** Undo and redo moved into the one contextual bar the
editor has left, beside the view switcher.

**Publishing floats in the canvas's own corner.** It is the thing you do at the
end of a session, not during one, and it had a full row of the window across the
top. Bottom-end corner now, over the canvas, still the most prominent control on
screen.

**51% → 85% of the window**, and the sweep asserts that share rather than the
presence of any particular element, because the share is the thing that matters.

### A regression this caused, and the arithmetic that fixes it

`CanvasFrame.reserved` existed so that opening the inspector would not resize the
page being edited: it *added* the panel's width back when the panel was open. With
250px of studio navigation no longer taken, that started computing a scale of 1.0
for a 1200px frame in a 1040px space — so the page stopped re-fitting and simply
ran off the end of the window.

The goal is unchanged and the arithmetic is now the other way round: the canvas
always lays out as though the widest panel were open, whether it is or not.
Opening it moves `clientWidth` and the reservation by the same amount in opposite
directions, so the scale does not move — and the frame fits in every state rather
than in only one of them.

Builder sweep 55 → 59 checks.

---

## 2026-10-01 (fourth pass) — Every part of a section, and the breakpoint bug underneath

A teardown of guidelines.site came in with the clarification that "section
template" meant *per-part* control, not a choice of preset — "the typography, the
user will be able to change the way of showing and viewing this section."

Looking for where to put those controls turned up something worse first.

### Responsive overrides did not work in the editor, at all

`emitNode` emitted `@media (max-width: 809px)`. A media query resolves against
the **viewport**. `CanvasFrame` lays the page out in a 390px-wide element and
scales it down inside a window that is usually 1400px or more — so the query was
false on the canvas and a phone override did nothing.

Measured, before the fix: a section with a phone-scoped `display: none` rendered
**790px tall** in the phone frame, with
`matchMedia("(max-width:809px)").matches === false`. The rule was emitted, the
inspector showed its override dot and its reset, the builder sweep went green, and
the studio saw no change whatsoever.

It went unnoticed because **every assertion about the cascade was about the rule
text**. The sweep found `max-width:809px` in a `<style>` tag and stopped there;
nothing measured whether the page changed. Its own closing line claimed "a phone
override applies at phone width and nowhere else", and `CanvasFrame`'s comment
claimed the framed element "believes it is 390px, so the same media queries fire
that fire on a phone" — which is not how `@media` works. Two confident comments
and a green suite, describing something that never happened.

Fixed with **container queries**, which is also what the teardown recommends
(§4.3: "the breakpoint is driven by the canvas container, not the window").
`[data-guideline-surface]` — the one element both the framed canvas and the
published page have — becomes a named container `g-page`, and every breakpoint
rule resolves against it. One rule, both surfaces, and the preview stops lying.
The hidden section now measures 0px in the phone frame and is untouched on
desktop.

The checks that would have caught it, both added: a unit test that
`emitNode` **never** emits `@media` for a breakpoint, and a sweep check that
measures the overridden section's rendered height instead of reading the
stylesheet.

### What each part of a section shows

`lib/sectionOptions.ts`, modelled on the teardown's content nodes — where a
palette carries `showName`, `showHex`, `showRgb`, `showCmyk` and `enableCopy`
rather than a layout name:

- **Colour** — which of HEX / RGB / HSL / CMYK it prints, names on or off,
  click-to-copy on or off, tiles per row.
- **Typography** — which scripts it sets (both, Latin, Arabic), the character set,
  the size scale, and **the sentence it is set in**, per script.
- **Logo** — the clearspace drawing, the colour variations, lockups per row.
- **Photography** — tiles per row, and framing (square / landscape / wide /
  uncropped).
- **Icons**, **mockups** — tiles per row, captions.

The lesson taken from the teardown is that the options are **flat and shared**
rather than a bespoke bag per section: `columns` means the same thing on a
palette, an icon set and a photo grid, so it is one field, one control and one
renderer path. Six private vocabularies for the same six ideas is how an editor
becomes impossible to learn.

Stored on a new `Workspace.sectionOptions`, deliberately *not* inside
`BlockStyle`. A `BlockStyle` is a set of visual declarations that CSS emitters
read and `isEmptyStyle` counts; these are content decisions no emitter should ever
see. Keeping them apart is what stops "show the character set" from one day
becoming a CSS property because it happened to live in a type called Style.

Every field is optional and **unset means "whatever the layout does"** — the same
contract as `BlockStyle`. A switch turned back on stores `undefined` rather than
`true`, so a section returns to following its default instead of pinning a value
that merely equals today's.

`columns` is the one option that needed CSS rather than a conditional: one number
from the studio becomes three (`--cols`, `--cols-tablet`, `--cols-phone`, halving
to a floor of two), spent by three rules in `globals.css`. Those rules are
container queries, so **choosing six per row steps down to two inside the
editor's phone frame** — which is the breakpoint fix paying for itself
immediately, and is checked.

### The inspector is tabbed

Content · Style · Layout, the teardown's §3.5 pattern. The panel had grown to a
900px scroll, and its controls answer three different questions: what the section
shows, what colour it is, how it sits on the page. A block has no Content tab —
its shape is the block kind that was chosen for it — and that is derived from the
selection rather than corrected in an effect.

Tests 236 → 252. Builder sweep 44 → 55 checks.

---

## 2026-10-01 (later still) — Each section, in a layout of its choosing

The six site templates decided the page *and* the inside of every derived section,
and there was exactly one of each: one way to show a palette, one way to show a
typeface. A studio could move the colour section, hide it, pad it, put it on a
brand colour — and could not make it look like anything other than a grid of
swatch cards.

Nineteen layouts now, across six sections: colour (swatch cards, full-width
bands, dense chips, primary featured), logo (full system, lockups only, primary
showcase), typography (specimen, size table, poster), photography (even grid,
lead image, full-width rows), icons (tiles, named tiles, dense set), and mockups
(two up, one up, three up). The first of each is the layout that section already
had, so **nothing in an existing guideline changes until somebody picks
something.**

### Where the choice lives, and why that was the whole design

`BlockStyle.variant`, on the per-section record that `sectionStyles` already
holds — so it gets `setSectionStyle`, persistence and undo for free. It is **not**
a style declaration but a choice of renderer, which is why no CSS emitter reads it
and why `isEmptyStyle` now ignores it: a section that has only had its layout
changed still needs no wrapper, and wrapping it anyway would have put a stray
`<div>` between a template's grid and its children the moment anyone chose
something.

The layout resolves **inside `FixedSectionBody`**, from `ws.sectionStyles`, rather
than being threaded in as a prop. `ws` was already in the context every template
builds, and every template renders its derived sections through that one
function — so the choice reaches all six templates, the editing canvas and the
published page with **no template edited at all**. This is the shared-renderer
property being spent rather than described.

### The precedence was wrong first time, and silently

Three templates render a body of their own: Docs and Atlas their own colour grids,
Manual its own palette and type pages. Those won unconditionally, so choosing a
layout did nothing whatsoever in two of the six templates — the picker moved, the
page didn't, and nothing said why. Found by running the probe across every
template rather than the one in front of me.

The rule now: an explicitly chosen non-default layout beats the template's own
body, which beats the shared default. Choosing the default back again stores
nothing and hands the section to the template, the same as every other unset field
in `BlockStyle`. Both directions are checked, because fixing the first by deleting
the override mechanism would have passed half of it.

**Deck is the honest exception.** It composes each section as a fixed 1920×1080
slide and never calls the shared body, so a layout chosen while it is selected has
no effect. The picker says so, rather than being a control that moves and changes
nothing — the same failure as the override bug, which is why it gets a note
instead of silence. The choice is still stored and applies on switching template.

### `data-layout`

Every arrangement — the alternates and the defaults — puts `data-layout` on its
root, carrying the key it is offered under. It costs no DOM and makes a rendered
page say which layout drew each section: it is what the sweep asserts against, and
the first thing anyone will want to know when a section looks wrong. The
alternative was measuring element heights, which is a check that breaks every time
a padding changes.

Shared primitives (the type scale, the two script specs, the swatch edge) moved to
`sectionShared.ts` for one reason: `Content.tsx` dispatches to
`SectionLayouts.tsx`, so anything the layouts imported back out of `Content.tsx`
would be an import cycle.

### A legibility bug these layouts invented, caught by measuring

Several of them set type directly on a client's own colour. `bestInkOn` already
takes the highest-contrast ink available there, so an opacity applied on top spends
the only margin that exists — and how much there was depends on a colour this code
has never seen. The first draft faded the featured block's 9px format labels to
0.6 and rendered **3.76:1** against a 4.5 bar, in both themes.

Fixed by the rule rather than by the number: **ink on a brand colour is never
faded.** Hierarchy there comes from size, weight and tracking, which cost nothing
legible. The contrast sweep now walks the alternate layouts in three rounds — it
had only ever seen the defaults — and fails if no layout rendered, because a clean
measure of a canvas that drew nothing proves nothing.

Tests 223 → 236. Builder sweep 36 → 44 checks. Contrast sweep now covers 19
layouts in 2 themes.

---

## 2026-10-01 (later) — Reversibility, and a feedback loop, from the Framer teardown

A teardown of Framer came in as a reference for the guidelines builder. Most of
what it recommends is already how this builder is built, and it is worth saying
which parts so nobody re-derives them from the document as a to-do list:

- **One renderer for the canvas and the published page.** The teardown calls
  this the decision that cannot be deferred. `LiveCanvas` mounts
  `LiveEditProvider` over the same six template components `/v/[slug]` mounts
  bare — there is no separate preview to drift.
- **Override-only replicas.** `BlockStyle.bp` / `.rtl` store what differs and
  nothing more, resolved desktop-first, with the inspector showing a dot where a
  value differs elsewhere and offering a reset.
- **A layers tree, breakpoint frames, direct manipulation.** All present.

Two of its recommendations are deliberately *not* taken. Its `<canvas>`/WebGL
option is wrong here for the reason recorded under spatial culling below. And
its free-CSS property model is wrong for a bilingual page: `BlockStyle` stays a
small set of semantic choices — `start`, not `left` — because a hard pixel offset
mirrors wrongly in Arabic, and the guideline site ships in both directions.

Three things were genuinely missing.

### Undo had no way back

There was a 60-deep undo stack and no redo. Undo alone is a trap rather than a
safety net: it makes trying something out cost an edit you cannot recover if you
change your mind twice. `redo` is now the mirror of it, on `Ctrl+Shift+Z` and
`Ctrl+Y` both, with its own button beside Undo. A fresh edit clears the redo
branch, because otherwise redo would restore a state the page never came from.

### The editor could say what a page *was*, not what was wrong with it

The way to find out that a section would render empty on the client's site, or
that a button pointed nowhere, was to publish and look. The teardown describes
three feedback loops Framer's agent gets after every edit — layout rectangles, a
design linter, rendered screenshots — and the linter is the one that is just as
useful to a person, and the only one that needs no server.

`lib/pageReview.ts` is that linter: pure, deterministic, 29 unit tests, no React
and no store. It reports empty sections, brand sections whose data is missing,
links that go nowhere or resolve inside the guideline site, forms with no
recipient, and bilingual gaps — and it runs the existing `lib/copyLint.ts` rules
over what is on the page, which until now could only be reached by pasting text
into the Compliance page.

Two of its rules were wrong when first written, and both were found by reading
the renderer rather than by reasoning:

- **Severity follows the fallback.** `BlockRenderer` resolves a field as
  `(isAr && block.arTitle) || block.title`. Missing Arabic therefore falls back
  to the English and the page is readable — a warning. Missing English falls back
  to nothing and the page renders a gap — an error. The asymmetry is the rule; the
  other way round would flag the normal state of a page being written as broken
  and the actually-broken one as a nicety.
- **A rule per real empty state.** The first draft flagged a type specimen with
  no typeface and a files section on a workspace with no files. Neither is a
  thing the client ever sees: `TypeSpecimen` always renders, and a files block
  shows its own chosen `assetIds` rather than mirroring the workspace. Both rules
  were deleted and `BrandDataPresence` lost the two fields that fed them, so the
  same mistake cannot be made again by filling in a field that is sitting there.

Untranslated-Arabic findings collapse into one counted row. A studio drafting in
English has no Arabic anywhere yet, and a linter that reports that once per field
is a linter people switch off — which would take the specific findings with it.

Publishing a page with errors now **asks** rather than refusing. Sending a client
a half-finished page to look at is a normal thing to do, and a builder that
decided which pages were allowed out would be wrong about that regularly. What it
can do is make sure nobody publishes an empty section without having been told.

### Selecting a section did not show it to you

The panel's own copy says "click a finding to jump to the section", and that was
false: selection alone does not scroll. Both editing shells now carry
`data-flow-id` — Framer's `data-node-id` convention, one addressable id per
rendered element — and the builder reveals as well as selects. The layers tree
got the same treatment, for the same reason.

The first version used `behavior: "smooth"`, and measuring it is why it doesn't:
Chromium gives a smooth scroll however long the distance demands, which was
**1.6 seconds to cross a 9,900px guideline**. That is a teleport in a scroll's
clothing — you watch the whole page stream past and arrive unsure whether you
moved or it did — and on a page this long it is the normal case, not the edge one.
Smooth is now kept for a hop under 1.5 screens and a long jump is instant, which
also respects `prefers-reduced-motion`. Measured through the real click path:
**992ms → 70ms.**

### The check that was crying wolf

`scripts/no-physical-props.mjs` failed the build on the word "right:" in the
middle of an English sentence — a comment explaining why the code beneath it was
correct. That is the exact failure the script's own header warns about twice,
arriving from the one direction it hadn't guarded. It now skips lines that are
entirely comment, and the interior of block comments. Deliberately conservative:
a declaration sharing a line with a trailing comment stays in scope, and nothing
tries to parse strings, because blanking everything after a `//` would truncate
the line holding `"https://…"` and silently stop checking what followed. Verified
by putting a real `right: 0` back on a line with a prose comment and watching it
get caught.

Builder sweep: 23 checks → 36. The "reviews clean" check runs *first*, before the
sweep's own palette drop adds a section — an earlier version ran at the end and
blamed the rules for a block the sweep had added itself.

---

## 2026-10-01 — Spatial culling, from the Milanote spec

Two reference specifications came in — a Canva-style whiteboard and a
Milanote-style workspace — as inspiration for the moodboard. Worth recording
that **they contradict each other on the central decision**: Canva's calls for
Konva or PixiJS on WebGL, Milanote's says explicitly not to use `<canvas>` or
WebGL and to build on DOM elements with a CSS `transform`, "to support native
text selection, inputs, and accessibility".

Markyos already does the second, and for that reason. The board holds notes you
type into and swatches you pick colours from; a WebGL canvas would mean
re-implementing text editing, focus, selection and screen-reader access from
nothing. The camera model the specs describe — a global `x, y, scale` applied as
one `transform` on a board container, with every node at absolute board
coordinates — is what `Canvas.tsx` has been doing all along.

So most of both documents describes the architecture already in place. One thing
did not exist, and it is the one the Milanote spec singles out for exactly this
product: **spatial culling**, "to render hundreds of images … only render those"
nodes intersecting the viewport.

Measured before building it, on a 150-card board: **150 cards in the DOM, 24 on
screen.** Every one of the other 126 cost an element, a prop comparison on every
frame of every gesture, and an image for the browser to hold. Dragging a card
had a worst frame of 1.5 seconds.

The canvas now renders only what is near the window, with a margin of 0.4 of a
screen in each direction so cards mount before they are reached. The margin is
in board units, so it widens as you zoom out — zoomed out, a screen of pan
covers more board. 0.4 rather than the 0.75 first tried, because the margin
costs area quadratically: 0.75 covers 6.25 screens and still kept 70 cards
mounted; 0.4 covers 3.2 and keeps 40.

| 150 cards, CPU 4× | before | after |
| --- | --- | --- |
| cards in the DOM | 150 | 40 |
| pan, p95 frame | 50.0ms | 16.8ms |
| pan, frames over 32ms | 62 | 5 |
| drag, p95 frame | 50.1ms | 16.8ms |
| drag, frames over 32ms | 51 | 6 |
| drag, worst frame | 1516ms | 550ms |

At **400** cards the DOM still holds 40 and pan is unchanged, which is the
actual claim: cost now tracks what is visible rather than what exists.

Culling is a rendering decision only — nothing about what is stored, what is
selected, or what the list view shows. That matters for more than tidiness: the
list is documented as the view that works without a pointer, so it remains the
one a screen reader can walk end to end.

### A check that was measuring something impossible

The obvious risk is a card vanishing out of the hand dragging it, so a check was
written to drag one far past the edge. It is not in the suite, and the reason is
worth keeping: **a pointer cannot put a dragged card outside the rendered
region.** The card follows the pointer, the pointer stays inside the window, and
the region extends beyond the window on every side. The check drove the mouse to
x=2400 on a 1440px viewport, where Chromium dispatches nothing, and then read
the resulting motionless card as the bug it was hunting.

The guard in `Canvas.tsx` stays, and what exercises it is an older check: "a
card dropped in the tray is filed under unsorted" ends its drag on a zone
outside the visible region, and it fails without it. A check that fails for the
wrong reason is worse than no check, because it is evidence of the wrong thing.

### Still needs provisioning

Both specs are mostly about real-time collaboration — Yjs CRDTs, a
`y-websocket` provider, the awareness protocol for live cursors, Redis for
ephemeral session state, Postgres for persistence. None of it is written here,
because all of it needs a server, and server work is blocked on provisioning
rather than on code. The data model is not far off what those specs assume: a
board is already a flat list of nodes carrying absolute coordinates and a size,
which is the shape a `Y.Array` of nodes wants.

Two things from the specs are **not** wanted and should not be added by
accident. Canva's `rotation` belongs to a design tool, not a board of reference
photographs. And its deeply-nested scene graph is explicitly warned against in
its own text for complicating CRDT sync; zones here are regions decided by
geometry on drop, not DOM parents, which is the same conclusion.

---

## 2026-10-01 (later) — The shake I had not found, the lag I had half-fixed, and motion for the guideline site

Reported as *still* bad after the previous pass, which was correct on both
counts. The earlier fixes were real, but each addressed a smaller cause than the
one that mattered.

### The editor shook because selecting resized the page

The insert-gap fix earlier today was genuine and is still in. It was not the
thing anybody was feeling.

Selecting a section opens the inspector, a 300px flex sibling of the canvas. So
the canvas host went **912px → 612px**, and `CanvasFrame` re-fitted the frame
from **0.76 → 0.65**: the page being edited physically shrank by 14% over 260ms
at the exact moment somebody clicked a line of text in order to rewrite it. Escape
grew it back. Click, escape, click, and it pulses.

Measured with `layout-shift` performance entries, which name the nodes that
moved: three selections produced **eleven shifts**, sourced to the canvas frame
itself.

The frame now takes a `reserved` width and adds it back before computing the
scale, so opening a panel changes the available width by nothing and the canvas
scrolls instead — which is why a Figma panel never resizes the artboard. A real
change, like resizing the window or collapsing the tools rail, still re-fits.
Total CLS across a selection went **0.0287 → 0.0001**.

The top bar also moved: its hint swaps between "Click any text to edit it in
place" and "Selected: overview", which are different widths, and it shared a box
with the view switcher and Auto-fill. Prose can reflow; a control somebody is
aiming at may not. The hint now takes the slack and the controls hold still.

**A probe fault worth recording.** The first run of this measurement reported a
perfectly still editor. `layout-shift` entries carry `hadRecentInput`, set for
shifts within 500ms of a click or keypress, and Core Web Vitals excuses those
because the person asked for them. "It shakes when you use it" is a complaint
about exactly those. Filtering them hid the entire fault.

### The moodboard lagged on the gesture I had not measured

Dragging a card was fixed and stayed fixed. **Panning** was the slow one — p95
frame 50ms, 122 frames over 32ms in a single pan — and panning is most of what
"grab any part of it" means.

The cause was the memo boundaries I had added failing exactly where they were
needed most. `toBoard` converts client coordinates to board ones, so it depended
on `view`; `view` changes on every frame of a pan; every handler built on
`toBoard` therefore got a new identity thirty times a second, and every card and
frame re-rendered. A card drag was smooth because a card drag does not move the
view. Reading the view through a ref makes `toBoard` permanent.

| 34 cards, CPU 6× | before | after |
| --- | --- | --- |
| pan, p95 frame | 50.1ms | 16.7ms |
| pan, frames over 32ms | 122 | 0 |
| pan, script | 4763ms | 777ms |
| zoom, frames over 32ms | 24 | 0 |

**And the boards were holding half a gigabyte of bitmap.** `fileToDataUrl`
stores whatever it is handed, and a moodboard is filled by dragging photographs
straight off a camera. Twelve 4000×3000 photos measured **576MB of decoded
bitmap** to draw cards of 2,533 pixels each. None of it shows in the file sizes,
because the encoded bytes are small — it is the decode that costs, and it is
paid on every raster. `lib/imageDownscale.ts` now caps uploads at 1600px on the
long edge, the same ceiling `stockImages.ts` already applied to fetched photos:
**576MB → 92MB**. It is a deliberate no-op below the ceiling, so nothing is
re-encoded that did not need to be, and the palette reader still pulls exact hex
values out of the original pixels.

### Motion for the guideline site

The app's rule is that nothing animates purely for decoration — on a tool people
use all day, motion that carries no meaning is latency. The client-facing site
is the other surface and the rule lands differently: it is a document a studio
*presents*, read once, top to bottom, and there pacing is the meaning.

`GuidelineMotion` adds two things, mounted only by the `/v/<slug>` routes and
never by the builder — the same templates render inside the editor, where
sections fading past while somebody edits would be the opposite of helpful:

- **Sections arrive as they are reached**, and the cards inside them arrive one
  after another. The rule that finds cards is drawn from what the templates
  actually emit rather than from class names, which differ in all six: a card
  grid is a `display: grid` whose children are all the same element. Heading
  rows are `display: flex` with two children of mixed purpose, so the test
  excludes them by construction. A section whose cards do the moving only fades,
  so nothing moves twice.
- **A progress bar**, because a guideline is long, has no pagination, and is
  often opened to decide whether the thing you need is in it.

Fail-open throughout: only an element the script has *claimed* is ever hidden,
so without JavaScript, without IntersectionObserver, or under reduced motion, no
element carries the attribute and the page renders exactly as it did. A
decoration must not be able to fail into invisible content. `beforeprint` reveals
everything, and a dead observer is caught by a timer.

**Three faults found while building it**, all of which looked like it working:

- The first fail-safe revealed every pending section on a plain two-second
  timer, so the page quietly un-hid itself before anyone had scrolled. The
  animation was never seen, and the probe reported zero sections pending and
  read as a pass. It now fires only when the observer has not called back at all.
- The effect depended on `sectionIds`, built with `.map()` in the viewer's
  render. The viewer re-renders on every scroll because the scroll-spy tracks
  the active section — so the effect tore itself down and rebuilt on every
  scroll event, deleting every attribute as it went.
- The probe checked sections for stranded content but not cards, which is the
  failure mode the cards introduced.

`responsive.mjs` now walks all **32** template/language/viewport combinations to
the bottom and fails if the reveal left anything invisible — a stranded section
is a hole in a client's deliverable. Broken deliberately it reports 1,276
stranded elements and exits 1. That sweep also now exits non-zero on its layout
findings, which it printed but never failed on, contrary to its own README.

---

## 2026-10-01 — The real logo, and two things that were measurably slow

Three pieces of work: the brand artwork was replaced with the finished files,
the guidelines editor stopped shaking, and dragging a moodboard card went from
136ms of JavaScript per pointer move to 7.5ms.

### The artwork

`Logo-01/02/03.svg` replaced the placeholders in `public/` as
`markyos-lockup.svg`, `markyos-wordmark.svg` and `markyos-mark.svg`. The
proportions changed — the mark went from 0.83:1 to square, the lockup from
3.78:1 to 5.01:1 — so every place they render was checked rather than assumed.
All five call sites size by `height` or by a width that still fits, so none
needed adjusting; the sidebar, auth shell, brands list, studio board and the
new-brand screen were each looked at rather than reasoned about.

**The pattern arrived as a 17490×7022 PNG, and ships as a 941px tile.** It is a
seamless repeat, so the whole sheet is 3MB of the same information over and
over. Finding the period took some doing: the file is black-on-transparent, so
every colour channel reads zero and the first three attempts measured a blank
image — the artwork is entirely in the alpha channel. Chromium also refuses to
rasterise 122 megapixels through `drawImage`; `createImageBitmap` with a crop
decodes it. The repeat is exactly 941px square (mean absolute difference 0.37
of 255, so: exact), and one tile resampled to 512px is 35KB — 1.1% of the
sheet, and crisp at any size because it now tiles instead of scaling.

### The guidelines editor shook

`.live-insert` — the gap between two sections, offering to put something in it —
sat in the page's own flow at 14px and grew to 38px on `:hover`. So pointing at
a gap pushed every section below it down 24px, and a page with fourteen gaps
jolted fourteen times on the way down it.

It also genuinely oscillated, which is the part that made it *shake* rather than
merely jump: the growth moved the strip out from under a pointer that was
standing still, which closed it, which moved it back. Measured at ten scroll
positions on the Vault canvas, the frame's content height flipped between two
values 24px apart with nothing touching it.

The gap now holds its 14px at all times and draws its button *over* the page
instead of wedged into it. This is the rule `--canvas-scale` already applies to
the section toolbar and the drag grip, stated once more: the page being
previewed owns the layout, and the tools for editing it are not part of the page
and may not move it. The drop target is the button rather than the strip, so
aiming at a gap mid-drag got easier at the same time — drag events bubble by DOM
tree, not geometry, so the strip's own handlers still receive them.

`CanvasFrame`'s resize loop was suspected first and cleared: the canvas scale
was swept across every window width from 1000 to 1800px and settles at all of
them. The published site at `/v/<slug>` was checked too and never moved.

### Dragging a moodboard card

The board held 60fps on an idle desktop, which is why this needed measuring
rather than eyeballing. With 34 cards and the CPU throttled 6× — an ordinary
laptop with a browser full of tabs — the p95 frame was **650ms** and the worst
was **1067ms**. The board froze for a second at a time.

Chrome's own counters said where it went: **92% script**, with style recalc and
layout together under 1%. So it was not the `left`/`top` positioning, which was
the obvious suspect and the wrong one. It was React re-rendering the entire
board on every pointer move, because every handler was written inline in the
render and so was a new function for all forty children each time.

The handlers now take the card or zone as an argument instead of capturing it,
which lets one function serve every child, and `CardOnCanvas`, `Frame` and
`BoardToolbar` sit behind memo boundaries. Boxes compare by value, because a box
is derived from the live gesture and rebuilt every render — comparing by
identity would report every card as changed on every move, which is the whole
thing being avoided.

`PlacedItem` compares by value too, and that one is worth its own line: one
person voting on one card cost a **1062ms** task, because `placeBoard` rebuilds
every item from the board and so gave all thirty-four new identities. Every
field is listed in the comparison, including the ones the canvas does not draw —
a comparison that quietly calls two different cards equal shows stale content,
which is a much worse failure than a redraw that was not needed.

| 34 cards, CPU throttled 6× | before | after |
| --- | --- | --- |
| script per drag | 73.6s | 4.05s |
| median frame | 33.3ms | 16.7ms |
| p95 frame | 650ms | 33.3ms |
| frames over 32ms | 190 of 363 | 28 of 341 |
| card's distance from the pointer | 5.8px | 0.9px |
| one vote click | 1062ms | 450ms |

Persistence was suspected and cleared: the snapshot is 59KB and writes in
0.2ms, because uploads already live in IndexedDB behind reference tokens.

### The check that could not fail

The shake is now a check in the builder sweep, and it took three attempts to
write one that actually catches it. Both earlier versions passed against the
exact CSS they were written to detect:

- **Synthetic events prove nothing about `:hover`.** A dispatched `PointerEvent`
  moves no cursor, and `:hover` follows the cursor.
- **A sweep steps over what it is looking for.** These strips are 14px in a
  600px frame; sampling every 45px walks between them and reports a page that
  never moved.
- **Sequential hovers cancel out.** Going straight from one gap to the next
  closes one as it opens the next, so a page lurching 20px at every gap reported
  a single change across the whole run. The pointer now parks clear of the
  canvas between measurements.

The check addresses all fifteen gaps by element. Restored to the old CSS it
fails 15 of 15; with the fix it passes.

---

## 2026-09-30 — A UX pass: what the screen says before you touch it

A sweep of the whole product against the usability principles it already claims
to follow, driving every screen in a browser rather than reading the code. What
follows is grouped by the fault, because most of these turned up in several
places at once.

### Text that could not be read

**The contrast report was two characters wide.** It lives in the builder's tools
panel, which is ~206px. With a swatch, a fixed-width badge and two gaps taken
out of that, its truncating label had 32px left: "Body text on the site ground"
rendered as "Bo…", with no `title` to recover the rest from. Twelve rows, every
one of them. A report nobody can read is worse than no report, because it still
occupies the space where one would go. Rows and the heading now wrap, and the
verdict badge drops to its own line when the panel is too narrow to hold both.

**The sidebar clipped its own longest label on every page of the app.**
"Company departments" needed 140px and had 137. A nav item is the one string
that has to be readable *before* you know what it says; truncating it means
choosing a destination from a word and a half. The rail went 232 → 248.

Both were found by a probe that walks every screen looking for an element whose
`scrollWidth` exceeds its `clientWidth` with no `title` or `aria-label` carrying
the full string — text that is cut off with no way to get at it by any means.

### The moodboard opened at 54%

Fitting seven zones into a laptop pane meant opening the board at 54%, where the
instruction sentences — whose whole job is to teach the board — render at six
pixels. The board was legible only after you found the zoom.

The opening view now fits what it can above a legibility floor and shows the
top-left of the board rather than the illegible whole of it. Fit is a button,
one press away, and pressing it is a thing you asked for and know how to undo.
`ZOOM_MIN` also went 0.2 → 0.1, so Fit can keep its promise on a board taller
than six screens.

### The canvas was not showing the template

`templates.ts` says a moodboard template is a method rather than a layout:
typed zones with an instruction card in each, so the board teaches its own use.
The list view had always drawn the ghost placeholders. The canvas — which is the
default view, and the one everybody opens first — called
`zoneSpecFor(undefined, …)`, which can only ever return `undefined`, so a new
board was seven empty rectangles.

The ghosts are now on the canvas, standing in the column and at the size the
card they create will have, and an empty frame is sized to hold them — so
filling the first hole does not push every other frame down the board. Pressing
one adds a card of that kind, in that place.

### Several cards at once

A board is a place where things get gathered, and moving a group one card at a
time is how a group stops being a group.

- **Shift or ⌘ click** adds and removes; **shift-drag on the background** ropes
  off an area. The other way round is what Miro does and is wrong here: this
  board's pan gesture *is* "drag the background", and taking that away to make
  room for a marquee would break a gesture people already have in their hands to
  add one they do not know about yet.
- **Dragging one of a selection moves all of it.** Only the card under the
  pointer snaps to the grid; the rest keep their exact offset from it. Snapping
  each card separately looks like the same thing and is not — a row somebody had
  just straightened would bend by a few pixels on every move.
- **⌘A** selects everything, **Delete** removes the selection as one action with
  one undo, **Escape** drops it.

Two faults surfaced only once more than one card could be selected. The
selection ring was `--accent-edge`, a 55%-alpha wash; and it was `inset`, which
CSS paints *under* an element's content — so on the board's commonest card, an
image filling its own frame, there was no ring at all. Selecting five
photographs looked exactly like selecting none of them. The ring is now solid
and drawn outside the card, where nothing can cover it.

### One key per tool

V, H, C · N, S, I, L, T, and F for Fit. Every board tool in Miro, Figma and
Canva has them, and reaching for the pointer to change what the pointer does is
the cost of not having them. They are in the tooltips, which is where somebody
who has just used the button is already looking; `aria-keyshortcuts` carries
them for a screen reader, rather than the key going into the button's name,
because "Colour S" is not what that control is called.

### Deleting a card can be undone

A card carries a position somebody chose, votes other people cast and
connections drawn to the rest of the board, and all of it went on one click of a
small × with nothing in the product to bring it back. A confirm on every delete
would be a tax on the ninety-nine times somebody meant it; an undo costs nothing
up front and still catches the one time they did not. Toasts can now carry an
action, and live for seven seconds when they do — 2.8 is enough to read a
confirmation and not enough to notice a mistake, find the pointer and act on it.

### The builder shrank the page you were editing

Selecting a section opens the inspector; the inspector takes 290px; the canvas
frames the page at a real 1200px and scales it to fit whatever is left. On a
1440px screen that left 634px, so the page was drawn at **51%** — 16px body copy
at 8px, in an editor whose central gesture is clicking a line of text to rewrite
it. The act of selecting a section was what made that section unreadable.

The scale now has a floor of 0.65 and the canvas scrolls below it, which is what
every other design tool does. And the frame publishes its scale as
`--canvas-scale`, which the editing chrome inside it undoes: the page's content
must scale, because that is the thing being previewed, but a 26px drag handle
drawn at 13px is a WCAG 2.5.8 failure and the tools for editing a page are not
part of the page. The section toolbar also moved to the start edge, because a
canvas that can scroll is a canvas whose far edge can be off screen.

### Controls that did not say what they were

A probe for missing accessible names, unlabelled inputs, skipped heading levels
and *duplicate* names in one view found six things, and each one was a place
where the interface expected you to work it out from position:

- **Strategy had no heading at all** — the only page in the app without one, and
  every panel on it was styled as a heading without being one. `Section` now
  renders an `h2`, and the edit view has an `h1`.
- **Fourteen buttons called "Add an element here"** on one builder page. Each is
  now named after the section it follows.
- **Four "Use this template"** on the templates page, and **four "Sign off"** on
  a guideline — the client's page, where the reader has the least context in the
  whole product. Both named for what they act on.
- **Three "EN | ع" pills** on the builder screen: the interface language, the
  canvas's preview language, and the one belonging to the page inside the
  canvas. All three were called "Preview language". They now say which they are,
  and carry a `data-lang-toggle` scope, because a name that is translated cannot
  be a selector.

### Filters that led nowhere

Brand files offered twelve type filters and two status filters whatever the
workspace held. This workspace holds three kinds of file, so eleven of those
chips could only ever produce "No assets match" — a control whose entire
function is to empty the screen. Hick's Law charges for every one, and each dead
one costs the trust that the others are worth pressing. The row now shows only
what is there, with counts: twenty chips became five, and "Pattern" became
"Pattern 4".

### Where the work is

Eight identical pills across Strategy, eight across Visual identity, and no way
to tell a finished section from an empty one without opening all of them —
recall, where recognition would do. Tabs now mark what is *empty* rather than
what is full, so the row is quiet when there is nothing to say and every mark is
a thing to do. Strategy also got a foot: "1 of 8", and the next section by name,
because a brand strategy is a document written in an order and it was presented
as eight interchangeable pills.

### Destructive controls that looked like the harmless one beside them

A department's delete was a `times` glyph — the app's own symbol for "close
this" — sitting 12px from the rename pencil in the same grey. "Delete board" sat
12px from "+ Zone" at the same size and weight. The confirm dialogs were already
there; what was missing is the half of error prevention that happens *before*
the click. Destructive controls now turn the warning colour under the pointer,
carry a bin rather than a cross, and are separated by a rule from whatever
constructive thing sits next to them.

On Team, "Make owner" was hidden on the owner's row, which shifted the role
control and the remove button sideways for every other row — a column of
controls that cannot be scanned. It is now always drawn and disabled there, with
a title saying why.

### Two empty screens sharing one sentence

A workspace with no files at all was told "No assets match. Upload something, or
clear the filters." There are no filters to clear on a brand-new brand, and
being told to clear them sends somebody hunting for a control that is not there.
There are now two messages — one for "nothing here yet" and one for "nothing
matches these filters" — and the second carries a Clear filters button rather
than describing one.

### A footnote about a button that does not exist

The brand gallery ended with "Deleting a workspace revokes its client link
immediately." There is no delete anywhere in the product. It now says the one
thing on that screen with a consequence outside the studio, which is what the
Shared badge means and where to switch it off.

### The phone

The builder on a 390px screen was a 60px rail, a 240px tools panel, and ninety
pixels of the page being edited. A narrow window now starts with both panels
shut — not shut permanently, because they hold the only route to Insert,
Template and Site, so they open on request, one at a time. The breakpoint is the
sidebar's own, which had this rule already and is now a shared hook rather than
a number written twice.

Five page headers put a heading and its description side by side with an action
button, fixed. On a phone that squeezed the description to about 150px — three
words a line — while the button held the rest. They wrap now.

### The tab row

Adding the empty-marks pushed Strategy's eight tabs past the window, which
surfaced two things that were already true and are now fixed: the row **follows
the selection**, so the new "Next: Personality & tone" cannot switch to a tab
that stays off the end; and it **fades the ends it can scroll to**, measured
rather than assumed, so a row that fits carries no hint of content that is not
there.

### `<html dir>`

The workspace shell sets `dir` on its own wrapper, which mirrors everything
inside it — and reaches nothing rendered at the document root. So the toast
stack and the dialog layer stayed left-to-right in an Arabic workspace, and the
logical properties they use resolved against an LTR document and quietly did
nothing. The shell now stamps the direction onto the document while a brand is
open, and takes it off on the way out, because the gallery, the login page and a
client's guideline are not that brand.

This one is worth remembering as a shape: a logical property is only logical if
something above it declares a direction. An `end-*` class on a root-level
element is not a fix, it is a fix-shaped no-op.

### Forty-one physical properties nobody was looking for

The toast's `right-6` should have been caught by `no-physical-props.mjs` and was
not, because that script only walked the five trees that *compute* geometry. The
argument for the scope was that app chrome "is mirrored by Tailwind already" —
true only of the logical utilities, and `text-left` is not one of them.

Widened to `app`, `components` and `lib`, it found **41**: thirty-odd buttons
and cards whose label was jammed to the physical left inside a right-to-left
layout, two blockquotes whose accent bar sat on the wrong side with the wrong
two corners rounded, a drawer that slid in over the sidebar, and a selection
checkbox pinned to a thumbnail's physical corner. All in a product whose pitch
is that neither language is the translation.

The bare `left:` / `right:` rule stays scoped to the geometry trees, because
`right` is also an ordinary React prop name — `<Row right={…}>` is not a CSS
declaration, and a check that cries wolf gets switched off.

### Seven panels you could not press Escape out of

Found by a probe getting stuck in one: a screenshot script pressed Escape to
close the asset detail sheet, the sheet ignored it, and every step after that
timed out against a backdrop intercepting clicks.

The app has one shared `Dialog` — the confirm and the prompt — which handled
Escape, trapped Tab and put the focus back. It also has seven panels that carry
their own layout: the asset detail sheet, the colour editor, the
extract-from-logo reader, the two document importers, the logo preview and the
competitor-table builder. None of them did any of it. They could be left only by
clicking the backdrop or finding the ×, which is no exit at all on a keyboard.

`lib/useModalDismiss.ts` is one line per panel: Escape closes it, and the focus
goes back to whatever opened it — without that, dismissing a panel drops the
caret at the top of the document and the next Tab starts again from the sidebar.
`scripts/sweeps/modals.mjs` is a thirteenth suite, because Escape not working is
the most common way an interface feels like a trap and the least likely thing to
be noticed by whoever built the panel.

### Half the interface was not bilingual

The Visual identity section — Brand files, Logo system, Colour, and the asset
detail sheet — was English-only, in a product whose pitch is that neither
language is the translation. `STATUS_META` had carried unused `arLabel` fields
the whole time, which is a fair sign of where it was left rather than what was
decided.

All four tabs now read in both: headings, descriptions, buttons, filter chips,
sort options, placeholders, empty states, toasts, the delete confirmations, the
font pickers and the whole asset detail sheet. Still English, and worth knowing:
the copy linter, and the type-scale role names. The Arabic here is drafted to be
usable rather than final, the same footing as the moodboard template copy.

One bidi fault came with it. A tag chip reads `#export`, and `#` is a *neutral*
character — inside an Arabic page it takes the paragraph's direction and lands
on the far end, so every tag painted as `export#`. The bidi sweep passes this by
design: it compares strong characters only, because neutral punctuation at
either end of a run legitimately reflows in an RTL paragraph, and counting it
inflated an early run from 4 findings to 62. `dir="auto"` on the chip resolves
it against the tag's own first strong character instead, so a Latin tag stays a
Latin token and an Arabic one reads the other way.

### Smaller things, same idea

- **Past compliance checks** said "1 flagged" and stopped. The flagged colours
  were already stored; only the swatches were missing, so the only way to find
  out *which* colour had drifted was to upload the file and run the check again.
- **The client password** is shown in the clear on purpose — it has to be read
  out — but the client link twenty pixels below it had a Copy and it did not, so
  the one thing on that card that has to travel was the one you selected by
  hand.
- **The design inspector** said "Design" twice: once as the panel's title, once
  again three lines below a paragraph.
- **Brand insights** put each value at its own cell's right edge in a two-column
  grid, which left "2/3" closer to the next label than to its own. Proximity
  decides what belongs to what, and it was answering wrong.

### What the sweeps learned

`moodboard.mjs` went from 33 checks to 43, covering the opening zoom, the
canvas's ghosts, one key per tool, a tool key typed into a note staying a letter,
a group drag keeping its arrangement, and an exact undo. Two of its existing
checks had to be taught something first: the board no longer opens showing
everything, so a check that clicked at a zone's coordinates was clicking outside
the canvas; and `asset-status.mjs` asserted all three status chips were always
present, which is exactly the thing that was wrong.

One probe fault worth writing down: a check compared *stored* coordinates before
and after a group drag, and a card that has never been dragged has no stored
position at all — so a card that had just moved 140px was reported as having
moved zero. Where a thing **is** is the honest way to ask whether it moved.

---

## 2026-09-30 — The board gets the window, and a toolbar

### Full screen

The board is what somebody is looking at on this page, and it had about half the
window. Full screen takes the rest: the breadcrumb bar, the title, the board
switcher and the footnote all go, the sidebar drops to its 60px rail, and the
browser's own chrome goes too where it is allowed. Measured, it takes the canvas
from 744px to 1000px on a 1000px window.

- It is **session state, not a preference.** Somebody who closes the tab
  mid-arrange and comes back tomorrow should land on a normal page with its
  navigation, not on a bare canvas wondering where the app went.
- The rail is the *same* preference the sidebar's own chevron and the `[`
  shortcut write, so the two cannot disagree — and it is put back on exit only
  if it was us who took it.
- Escape unwinds one step at a time: an armed tool, then full screen, then the
  selection. Escape is the key people press when they are not sure what state
  they are in, which is exactly when losing three things at once is worst.
- `requestFullscreen` is best-effort and its refusal is not worth a message; the
  in-app half is what matters. The opposite direction *is* handled — F11 or Esc
  leaves the browser's full screen without telling React, so `fullscreenchange`
  brings the two back into agreement.

**`useLocalPref` had to be fixed first.** It was a `useState` per call site,
seeded from storage on mount and never told about anything written afterwards —
so two components reading one preference agreed until one of them changed it,
and then disagreed until a remount. Invisible while a preference has one reader,
immediate the moment it has two. It is now a `useSyncExternalStore`, and picks
up writes from other tabs as well, which it also used to miss.

### A tool palette along the bottom of the board

Select, Pan, Connect · Note, Colour, Image, Link, Typeface · zoom and fit · tidy
and full screen. Bottom-centre, floating over the canvas.

Three reasons, all pointing the same way. It is where every canvas tool puts
them, so it is where people look. It stays with the board into full screen,
where there is no page header left to put anything in. And the distance from the
board to its controls is the distance the pointer travels between deciding and
doing — Fitts's Law says that is the number to shrink.

- Every gesture is still reachable *without* its tool: a card drags under
  Select, the background pans under Select, a card's own port connects under
  Select. A mode you have to be in is a mode you can be stuck in. The tools are
  the discoverable route to the same gestures, and the only route to the two
  with nowhere to hang an affordance — placing a card *somewhere specific*, and
  panning across a board so full there is no background left to grab.
- A placing tool puts the card where it was clicked and files it by the frame
  that point is inside, which is the same rule a dragged card follows. Then it
  returns to Select: a placing tool that stays armed turns every subsequent
  click into another card.
- The swatch card's face used to be a colour input covering the whole card, so
  there was nowhere to pick it up from. The colour picker is now a corner
  control and the face is the card.

### The board did not render in Arabic at all

The canvas layer was anchored with `inset-inline-start` while everything on it
was positioned with physical `left`. In Arabic that put the origin at the right
edge and laid the whole board out from there, off screen. An Arabic studio
opened the board and saw an empty grid.

The board's coordinate space is **physical in both languages**, and now says so:
a card at x=40 is forty pixels from the left of the board however the language
runs, because a board is a space, not a sentence. The card and frame *contents*
still mirror — headings, instructions, and every label. What does not mirror is
the geometry, and that is deliberate: flipping derived positions per viewer
language would mean a card moving to the other side of the board when somebody
toggled the preview, which is a far worse bug than the first frame being on the
left.

The resize corners are physically bottom-right for the same reason: the resize
arithmetic is `w = pointer.x - box.x`, which only describes a handle on the far
side of the box. Mirroring the handle without the arithmetic would make an
Arabic frame shrink as it was dragged outward.

**`no-physical-props.mjs` should have caught this and did not.** Its `left:` rule
required a literal value — a digit, `auto` or `0` — so every computed one went
through, and a computed position is exactly the kind a person cannot check by
eye. It now matches any value, and the four genuinely-physical lines carry
`physical-ok:` with the reason.

### Three probe faults, found by making the sweeps look at the board

The moodboard has nothing on it until a board is made, so the interaction and
surfaces sweeps had been walking that page for weeks and only ever measuring its
empty state. Opening a board first took the interaction sweep from 952 to 1040
elements — and produced 71 findings, 69 of which were the probe.

- **42 missing focus rings.** `:focus-visible` is a heuristic on the last input
  *modality*, and the click that opens a board switches it to "pointer" for the
  rest of the session. Every programmatic `.focus()` after it is then correctly
  judged as not needing a ring. One `Tab` restores the modality the check is
  about.
- **14 "the cursor lies about what this is".** `nwse-resize` on a resize corner
  and `crosshair` on a connection port are the conventional shapes for those
  gestures; demanding `pointer` of them is Jakob's Law enforced against itself.
- **Two findings that reported a control as dead while proving it was not.** The
  baseline fingerprint is taken with whatever is under the pointer already
  hovered, and the selector that opened the board also matched the switcher pill
  for the board *made from* that template — leaving it hovered and the next
  control focused before anything was measured. The sweep now parks the pointer
  and blurs before taking a baseline, the picker carries
  `data-template-picker` so the selector cannot match two different things, and
  a dead-hover finding now prints the two fingerprints rather than just the
  verdict.

One real finding survived: the resize corners were 18×18, under WCAG 2.5.8's
24px floor. They are 24px of target around a 9px glyph now.

### Tests

`npm run check` — 9 gates, 186 unit tests. `npm run sweep` — 12 suites; the
moodboard's is now 33 checks, covering the toolbar's position, that a tool arms
rather than acting, that a placed card lands where it was clicked and is filed by
the frame it landed in, that full screen actually gives the canvas the window and
Escape gives it back, and that every frame is on screen in Arabic. That last one
is the check the RTL bug needed: the DOM was identical either way, every element
had a box, and only where those boxes *landed* was wrong.

---

## 2026-09-29 — Surfaces, the moodboard canvas, and drag-and-drop

Three reports, three different causes, one method: measure it, fix the cause,
leave a check behind.

### You could not tell where a card was

`--surface-1` on `--canvas` measured **1.06:1 on the dark theme** and 1.18:1 on
the light one. That is not a subtle card, it is an absent one — a page of files
read as one slab with no objects on it, which is exactly how it was reported.

Near black, a large luminance step is a small ratio, so on the dark theme the
fill cannot be pushed further without lightening the deepest card the whole text
ramp is solved against. That is why every dark interface of this shape draws a
**border** rather than a brighter fill, and it is what this now does.

- `--hairline-strong` stopped being a slightly darker hairline and became **the
  card edge**, solved so its composite clears 1.5:1 against the card it bounds
  and 1.4:1 against the ground, in both themes. About a hundred call sites that
  already used it got a real edge for free.
- `.mk-surface` for the cards that had no edge at all. Applied where
  `scripts/sweeps/surfaces.mjs` said it was needed and nowhere else.
- The surface ramp widened as far as the text ramp allows: the dark canvas is
  deeper, the dark cards lighter, `--surface-3` a step down rather than up
  because `--text-faint` is solved against it at exactly 7:1.
- `contrast-audit.mjs` gained an **edge** section, so this cannot drift back.

Several of these were using `--hairline` — the *interior divider* — as a card
edge, which is how the lifecycle board's columns ended up with a 1.35:1 line
around a card sitting 1.12:1 from the page. Neither route found the boundary.

### You could not see the logo on the card

`lib/markTone.ts` has measured uploaded artwork since the day a brand's blue
mark started rendering orange. What it could not do was answer "will this read
*here*", because it took a light/dark flag rather than a surface: a thumbnail
well, a guideline page and the sidebar are three different greys.

- `MarkProfile.luminance` is now **WCAG relative luminance**, not a mean of the
  gamma-encoded bytes — a perceptual lightness is not a quantity a contrast ratio
  means anything with. The two plate thresholds moved with it.
- `placeArtwork(profile, groundLuminance)` replaces the two half-decisions with
  one: reverse a single-tone mark, or put a plate behind anything that still
  cannot separate, or — the common case — leave the brand's artwork alone.
- `components/AssetThumb.tsx` reads the ground out of the **live token** and
  re-reads it on `data-theme`, not on React's copy of the theme. The first
  version keyed it to `useTheme()`, and the surfaces sweep caught the
  consequence: every thumbnail correctly adapted for the theme the page had
  loaded in, and none of them for the theme it was being displayed in.

### The moodboard was an importer, not a board

Files went in and came back as a grid. That is a contact sheet. Arranging is
what a moodboard is *for* — putting two references side by side because they
belong side by side, drawing a line between a typeface and the photograph it was
chosen for — and none of it is expressible in a grid, because a grid decides the
position and the position is the content.

It is now a real canvas: pan, zoom, free placement, resizing, frames, and
connections between cards. Three decisions are load-bearing.

- **Position is derived, not migrated.** `lib/moodboard/layout.ts` computes a
  place for every card and frame, so a board made before any of this existed
  opens arranged, and only what somebody actually dragged is stored. "Tidy up"
  is therefore *clearing* the overrides rather than writing new ones — which
  keeps it re-runnable and stops today's layout being frozen into the data.
- **A zone is a region, not a band.** Dropping a swatch inside the Palette frame
  is what files it under Palette. That is what keeps "propose this palette"
  meaningful on a surface where anything can be anywhere: the board stays typed
  while the arrangement stays free.
- **Dragging writes once.** The pointer moves sixty times a second and the store
  persists on every write, so a drag lives in local state and commits on release.

The list view stays, and not as a fallback: a freeform canvas is a pointer
instrument, so the list is the way to do everything except arrange without one.

**Two real bugs found on the way.** `removeMoodboardZone` was deleting its
cards, while both the type and the tray's own documentation said they moved to
Unsorted — an image somebody chose, silently gone because the band it was filed
under got renamed out of existence. And an `<img>` is natively draggable, so
pressing on a photograph handed the pointer to the browser's own image drag and
fired `pointercancel` mid-gesture: a card could be picked up and silently
dropped one frame later, with no error and nothing stored.

### The site designer had no drag-and-drop

Three separate gaps, and the first is the one worth recording.

- **The layers tree's drag was state with no handlers.** A `dragId` threaded
  through both components, a comment promising "buttons as well as dragging",
  and not one `draggable` attribute or drop handler in the file. It read as
  finished from the outside, which is the only kind of missing feature nobody
  reports.
- **The Elements palette was click-only**, so every new section arrived at the
  bottom of the page and had to be dragged back up past everything else. It now
  drags onto the page, every gap opens while something is in flight, and the gap
  under the pointer says what will land in it. The kind travels as
  `application/x-markyos-block` rather than `text/plain`, so a file dragged in
  from the desktop is not mistaken for a request to add a text block — and it is
  also held in React state, because `DataTransfer.getData` is blocked during
  `dragover` and the canvas otherwise has no way to know what is crossing it.
- **A section's drag handle only existed inside the toolbar of an
  already-selected section.** Reordering was click, wait, press-and-hold, drag —
  four steps, with nothing anywhere saying the gesture existed. The handle now
  appears on hover, before any click.

### Tests

- `npm run check` — 9 gates, 186 unit tests (17 new, on the layout engine).
- `npm run sweep` — 12 browser suites. One new: `surfaces.mjs`, which measures
  card-against-ground separation and artwork-against-surface separation on every
  page in both themes. First run: **82 surfaces and 2 images**. Now zero.
- `moodboard.mjs` and `builder.mjs` grew the checks the new gestures need — that
  a drag *stores* a position rather than only appearing to move something, that
  where a card lands decides which zone it belongs to, and that deleting a card
  takes its connections with it.

---

## 2026-09-29 — Interaction quality, and the light theme

Measured rather than eyeballed. `scripts/sweeps/interaction.mjs` encodes seven
rules as browser checks across fifteen screens in **both themes**: Fitts's Law
(WCAG 2.5.8), feedback, focus visibility (2.4.7), the Doherty Threshold, cursor
affordance, the Zeigarnik effect on blocked actions, and `prefers-reduced-motion`.

First run: **528 findings.** Now zero, across 952 elements sized, 838 hovered
and 740 focused.

### 145 controls did not answer the pointer — one cause, one rule

The sidebar's brand link, the theme switcher, the language toggle, Accept and
Reject on the drafts queue. Not a handful of oversights: almost everything here
is coloured with an inline `style={{ background }}`, because the colours are
tokens resolved in TypeScript — and **an inline style cannot express `:hover`**.
A stylesheet rule setting `background-color` on hover loses to it, whatever its
specificity. The usual fix is a hover class at every call site: several hundred
edits, and one forgotten call site from being back where it started.

`background-image` is a different property. A veil painted there composites over
whatever colour the inline style chose. It is a tint of `currentColor` rather
than a fixed black or white, which is what makes one rule correct in both
themes: the ink is always the opposite of the fill by construction, so a tint of
the ink always moves the surface away from where it was. A white button darkens;
a dark button lightens; neither theme is special-cased, and nor is the one white
primary button that a fixed veil would have left inert.

It needs `!important`, and this is the case that word is for: most call sites
use the `background` **shorthand**, which sets `background-image: none` inline.
The first version of the rule silently skipped every one of them, and the probe
caught it — `hovered=true` and `background-image: none` on the same element.

A `<select>` takes `filter` instead, since a background-image disturbs its
dropdown arrow.

### Light theme

- **The scrollbar was invisible.** It was drawn in `--surface-3` — a *surface*
  token borrowed for a control — which on the light theme is #e4e4ea on a
  #eeeef2 canvas: **1.1:1**. Not a subtle scrollbar, an absent one, on the
  element that says there is more to read. It now has its own token at 3:1
  against its worst ground, and `contrast-audit.mjs` gained a **non-text**
  section (WCAG 1.4.11) so it cannot drift back.
- **Elevation is per theme.** Every floating surface was `rgba(0,0,0,.35)` or
  heavier — tuned on the dark theme, where a black shadow on a near-black canvas
  does almost nothing, then carried unchanged onto a light theme where it is a
  bruise under every menu. `--shadow-pop` and `--shadow-modal` now differ.
- **The in-place editor's focus tint** was a literal `rgba(0,153,255,.06)` — the
  dark theme's blue, glowing under text on a theme that no longer uses it.

### Fitts's Law

The board's brand-name link was a 19px target and the primary thing anyone does
with a card. The avatar is now *inside* the link rather than beside it — a
bigger target and, by the law of common region, one object instead of a picture
next to a link.

### Blocked actions now say what is blocking them

Publish, Claim, and the move-up/move-down pairs. A greyed-out control with no
reason sends someone hunting through settings for a permission they already
have.

### Icons

`scripts/icon-names.mjs`, in the gate. `app/icons.css` is an offline stand-in,
and a name it does not define renders as a **solid square** — no error, no
warning, and it looks deliberate. Written after two such names were added in
this very session (`star`, `sitemap`) and caught only because the check was
being written at the time. It also reads icon names out of lookup maps and
ternaries, which is where both misses were hiding, and ignores the left side of
a comparison, which is where its own first four false positives came from.

Separately: the builder's layers tree drew every section with the same glyph.
Sixteen identical icons carry no information; they now differ per section, which
turns finding the colour section into recognition rather than reading.

---

## 2026-09-29 — Document core, builder shell, moodboard zones

Against `markyos_builder_moodboard_spec.md` (Revision 1.0). That document is not
in this repository — see `docs/specs/README.md`.

### WS0 — schema preparation

- `GuidePage` gained `order` (fractional), `version`, `legacy`, and a `nodes`
  relation. `BlockNode` added: flat, client-generated ids, named slots,
  locale-keyed `content`, and `overrides` separate from `props`.
- Moodboard restructured: `Moodboard` → `MoodboardZone` → `MoodboardItem`, with
  `MoodboardVote` as its own table.
  - `MoodboardItem.assetId` is now nullable, because a note, a swatch and a
    link are cards without being files.
  - Votes became rows rather than a counter. A counter cannot answer "did I
    already pick this?", and two people voting at once on a counter is a lost
    update on the one number the shortlist sorts by.
- `ZoneKind` and `MoodItemKind` enums added.
- `prisma validate` passes. No migration — there is still no database.

### WS1 — the document core

`lib/doc/core/{types,order,tree,resolve,ops,rules,validate}.ts` and
`lib/doc/css/emit.ts`. Pure TypeScript, no React and no Prisma. 85 unit tests.

- **Fractional indexing vendored** rather than installed (`order.ts`), so its
  edge cases are covered by this repo's own tests. The 1,000-random-insert test
  caught a real bug on the first run: the head-class transitions on decrement
  were inverted, which produced keys that sorted wrongly rather than an error.
- **Ops are the only write format** — one validator, one permission check, one
  undo implementation, one conflict rule, instead of four of each.
- **`invertOp` for a delete returns the whole subtree as creates**, parent-first,
  so undo restores it exactly. Figma's model: the deleting client keeps the
  data, the server keeps nothing.
- **`propPath` is the conflict key.** Two locales of one field are separate
  paths, so two people writing the English and the Arabic of one heading never
  conflict.
- **Structural edits happen in one view.** `rules.ts` refuses create/delete/move
  from any secondary breakpoint or direction, and refuses `setProp` there
  because it would change the shared value from a place that cannot show it.
  The primary view is desktop in the *workspace's own* language — an
  Arabic-first brand edits its structure in Arabic.
- **The CSS emitter refuses physical properties** and produces byte-identical
  output for equivalent input, so snapshots diff cleanly.
- `zod` added (allowed by §3; nothing else was).

### R1 — logical properties

`scripts/no-physical-props.mjs`, wired into `npm run check`. Scoped to the trees
that render or build brand pages. A line may opt out with `physical-ok: <why>`.
Verified against known-bad input before being trusted.

### Builder

- **Layers panel** (`components/builder/LayersPanel.tsx`) — the page as a list
  of its parts, with reorder by button as well as by drag, and a marker on
  anything hidden only at a narrower width.
- **View switcher** — Desktop / Tablet / Phone × EN / AR, with a banner naming
  where structure is edited when the current view cannot.
- **`CanvasFrame`** lays the page out at the *real* pixel width of the chosen
  breakpoint and scales it with a transform to fit. The element believes it is
  390px, so the same media queries fire that fire on a phone. `zoom` would have
  been simpler and would have changed the width the queries resolve against,
  which is the thing being measured.
- **The cascade, on the model that exists.** `BlockStyle` gained
  `bp: { tablet, phone }` and `rtl`. Because inline styles cannot express a
  media query, `blockStyleRules` emits real rules through the document core's
  emitter. The inspector writes into whichever scope the current view owns,
  marks fields that differ elsewhere, and offers a reset.

**Decision — editor shell: extend the existing builder, not Puck.** Reasoning in
`docs/audits/builder-audit.md` §5. The spike was not run; the decision rests on
the written decision rule plus the audit, and should be revisited by anyone who
disagrees.

### Moodboard

Rebuilt as typed zones rather than a wall of pictures.

- Five templates as data (`lib/moodboard/templates.ts`), each a *method*: bands
  with an instruction card and ghost placeholders, so the board teaches its own
  use. All copy marked `TODO(copy)` pending Abdullah's final wording.
- Five card kinds — image, colour, note, link, typeface.
- The **Unsorted tray** is always last, and cannot be deleted: it is where a
  card goes when its zone is removed.
- **Palette extraction** is k-means in OKLab with k-means++ seeding on a fixed
  pseudo-random sequence (`lib/moodboard/kmeans.ts`). Deterministic by
  construction, and tested to be. Kept separate from `lib/extractPalette.ts`,
  which answers a different question — that one reports the exact colours a
  vector file contains, this one clusters a photograph.
- **Zones propose; they never write.** Palette → a colour Draft. Words → a
  Voice Draft. Nothing reaches the brand without someone accepting it.
- Votes are one per person, by name.

**Fixed along the way: the published snapshot carried the whole Creation
Layer.** Publishing copies the workspace and subtracts, which is the right
default for anything the site displays and the wrong one for anything private —
a new private field leaks by being forgotten. `moodboards`, `drafts` and
`briefs` are now named and emptied explicitly, and the sweep fails if a new one
is not. Found by the moodboard sweep, not by review.

### Tests

- `npm run check` — 8 gates, 169 unit tests.
- `npm run sweep` — 10 browser suites. Two new: `builder.mjs` (17 checks) and a
  rewritten `moodboard.mjs` (17 checks), which builds its own PNGs of known
  colours so the palette assertion is exact rather than "some colours came
  back".

### Not done

- WS2 proper: the block registry, the layout primitives, and moving the builder
  onto `BlockNode`.
- WS4 `applyOps`: the core is written and tested; nothing calls it, and there is
  no server to enforce against.
- WS5 and WS6: blocked on WS4 and on provisioning.
- The Puck spike (§6.2). See the decision above.
