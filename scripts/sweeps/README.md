# Browser sweeps

Thirteen suites that drive a real browser against the dev server. They exist
because the things they check — bidi ordering, phone layout, rendered contrast,
whether data survives a reload — cannot be caught by `tsc`, `eslint` or a unit
test. Every one of them was written after a bug that shipped past all three.

They are **not** part of `npm run check`, because they need a running dev server
and a browser binary. The architecture revision's §16 recommends running them as
a CI job on every pull request once CI exists; until then they are run by hand.

## Running them

```bash
npm run dev            # in another terminal, port 3000
npm run sweep          # all thirteen
npm run sweep:contrast # or one at a time
```

Each exits non-zero on failure, so they drop straight into CI when it arrives.

Playwright is a standing devDependency rather than something installed and
removed around each run. That was the old habit, from when these checks were
throwaway scripts that existed for an afternoon; now that they are committed and
have npm scripts pointing at them, a command that cannot run without a hidden
setup step is worse than the ~300MB it saves. `npx playwright install chromium`
is still needed once per machine to fetch the browser binary itself.

They sign in as the seeded demo account (`nadeen@studio.com` / `markyos2026`)
and drive the `nadeen-studio` workspace. Some write directly to
`localStorage["markyos:v1"]` to set up a fixture — always in a fresh browser
context, so nothing leaks between runs or into a real browser profile.

## What each one covers

### `bidi.mjs`
Walks every studio page **and every tab** in Arabic and measures where the first
and last strong characters of each Latin/numeric run actually paint. A string
that reads `236 KB` in the DOM can paint as `KB 236` inside `dir="rtl"`, and
only geometry catches it — `textContent` looks perfect either way.

It compares *strong* characters only. Neutral punctuation at either end
legitimately reflows in an RTL paragraph; counting that as reversal inflated an
early run from 4 real findings to 62.

### `responsive.mjs`
All 8 template variants × English/Arabic × phone (390px) and tablet (768px) —
32 combinations. Flags document-level horizontal scroll and any element
painting past the viewport.

Two guards earn their keep. It asserts the guideline actually rendered, after an
early version returned a clean sweep of the **password gate** rather than the
templates. And it skips elements an ancestor clips with `overflow: hidden`,
because `getBoundingClientRect` reports full geometry regardless — decorative
artwork bleeding inside a slide frame is not overflow anyone can see.

It also walks each combination to the bottom and fails if the guideline site's
scroll reveal left any section or card invisible. That check lives here because
this is the only sweep that drives all eight templates, and the rule that finds
the cards to stagger is generic — a `display: grid` whose children are all the
same element — so it has to hold against templates nobody had open while it was
written. A stranded section is a hole in a client's deliverable, not a cosmetic
slip. Broken deliberately it reports 1,276 stranded elements.

Note that until 2026-10-01 this sweep **printed** its layout findings and still
exited 0, so a finding could never fail the chain, contrary to the promise at
the top of this file. It exits non-zero now.

### `persistence.mjs`
The regression suite for the `BrandRepository` seam: edit, reload, confirm it
came back. Also covers the hydration backfills, the session-alive marker, and
that corrupt storage drops you into an empty app rather than a blank screen.

### `asset-status.mjs`
That exploration and archived assets are excluded from the published snapshot
and cannot appear on `/v/<slug>`. This is architecture principle 2 — exploration
is never the source of truth — as an executable check rather than a convention.

### `drafts.mjs`
The review queue, and the rule underneath it: a queued proposal has changed
nothing. Covers accept (including the confirm before overwriting existing
wording), reject, supersede, and that a rejected draft is kept rather than
deleted — "we considered this and said no" is a different answer from "nobody
ever suggested it".

### `brief.mjs`
The whole discovery loop: create from a template, adjust the questions, send,
the client answers at `/b/<token>` with no account, submit. Then the part that
matters — mapped answers become *pending drafts* and never touch the strategy.
Also that an unsent brief refuses to open, a closed link says it was switched
off rather than 404, and resubmitting produces no duplicate drafts.

### `moodboard.mjs`
Builds its own PNGs of known colours with `zlib`, so the palette assertion is
exact rather than "some colours came back" — a 70/30 two-colour image has to
come back as `#dc2828` and `#1e3cc8`, and twice in a row identically.

It drives **both views**, because they are not the same feature twice. Content —
adding, reading, voting, proposing — is checked in the **list**, which is the
view that has to keep working without a pointer; a check that only exercised the
drag path would not notice if the list stopped. Arranging is checked on the
**canvas**, where the interesting properties are invisible everywhere else: that
a drag *stores* a position rather than only appearing to move something (a card
that looks moved and wrote nothing jumps back on reload), that where a card lands
decides which zone it belongs to, that two cards can be connected and
disconnected, and that deleting a card takes its connections with it.

It also seeds a 140-card board — by cloning the cards already there, since what
is being measured is the number of nodes and the render path is identical — and
asserts the canvas renders a fraction of them. The board is an infinite surface
and a studio fills it; without culling, 150 cards meant 150 in the DOM for 24 on
screen.

There is deliberately **no** check that a dragged card survives leaving the
rendered region, and the reason is a trap worth knowing: **a pointer cannot put
it there.** The card follows the pointer, the pointer stays inside the window,
and the region extends beyond the window on every side. A check written for it
drove the mouse to x=2400 on a 1440px viewport — where Chromium dispatches
nothing — and then read the motionless card as the bug it was hunting. The guard
in `Canvas.tsx` is exercised instead by the older "a card dropped in the tray is
filed under unsorted" check, whose drag ends on a zone outside the visible
region and which fails without it.

Everything on the canvas is asserted against **stored state**, never pixels —
with two exceptions where geometry *is* the thing being tested. The toolbar has
to be at the bottom centre of the board, and in Arabic every frame has to be
inside the canvas. That second one is the check the RTL bug needed: the DOM was
identical in both languages, every element had a box, and only where those boxes
landed was wrong.

Full screen is driven end to end — the canvas grows, the sidebar drops to its
rail, the page chrome is gone rather than scrolled off, and Escape gives all
three back exactly as they were.

It also checks the things that make this a board rather than a list with
coordinates: that it **opens at a zoom somebody can read** (fitting seven zones
into a laptop pane meant opening at 54%, where the instruction sentences render
at six pixels); that the **canvas shows the template's ghosts**, not only the
list view; that **every tool has a key** and that a tool key typed into a note
stays a letter; that **dragging one of a selection moves all of it by the same
delta**, so a row somebody straightened arrives straight; and that **deleting a
card can be undone exactly** — same card, same zone, same votes.

Three things it taught while being written:

- The board no longer opens showing all of itself, so a check that clicked at a
  zone's coordinates was clicking outside the canvas, doing nothing, and leaving
  a tool armed — after which the first Escape disarmed the tool instead of
  leaving full screen, and the run timed out three checks later looking for a
  control that only exists outside it. Press Fit before aiming at anything below
  the fold.
- Compare where a card **is**, not what it stored. A card that has never been
  dragged has no stored position — it is derived — so a check that compared
  stored coordinates reported a card which had just moved 140px as having moved
  zero.
- Select by a `data-` hook, never by an accessible name, in any check that runs
  in both languages. Two selectors broke this way in one pass: the Fit button,
  and the language toggle whose group name is itself translated.

Two things it taught, both now fixed in the product:

- Grab a card in the middle, not near its top edge. The vote and delete controls
  sit along the top and correctly stop the pointer reaching the card, and the
  first version of the drag check reported that dragging was broken.
- An `<img>` is natively draggable. Pressing on a photograph hands the pointer to
  the browser's own image drag and fires `pointercancel`, abandoning whatever
  gesture was in flight — a card picked up and silently dropped a frame later.

Also still covers the rule the whole page exists under: every moodboard image is
EXPLORATION, reading an image proposes swatches rather than writing colours, a
vote is recorded against a person rather than as a count, and a publish leaves
the whole Creation Layer out of the snapshot. That last check is the one that
found a real leak — publishing copies the workspace and subtracts, which is right
for display fields and wrong for private ones, and `moodboards`, `drafts` and
`briefs` were riding along. If a collection is added to the Creation Layer and
not named in `publishGuideline`, this suite fails.

### `builder.mjs`
The builder shell. The check worth understanding is the frame width: it asserts
the canvas element **lays out at** 1200 / 810 / 390 CSS pixels, not that it
looks smaller. A frame that scales its contents while staying full width shows
a squashed desktop layout and calls it a phone, and no screenshot can tell the
difference.

It also holds the check that the canvas does not move under the pointer — the
editor used to shake, because the insertion gap between two sections grew 24px
in the page's own flow when you pointed at it. That check took three attempts,
and each failure is a trap worth knowing before writing another one like it:

- **A synthetic `PointerEvent` cannot test `:hover`.** Dispatching one moves no
  cursor, and `:hover` follows the cursor. The first version passed against the
  exact CSS it was written to catch.
- **Sweeping the pointer steps over small targets.** The strips are 14px tall in
  a 600px frame; sampling every 45px walks between them and reports a page that
  never moved. Address the elements instead — `locator(...).nth(i)` cannot miss.
- **Sequential hovers cancel out.** Moving from one gap straight to the next
  closes one as it opens the other, so a page lurching at every gap reported a
  single change across the whole run. Park the pointer clear of the target
  between measurements, or you are measuring a difference of two faults.

The general lesson, and the reason it is written down here rather than in a
comment: **a new check is not finished until it has been made to fail.** Break
the fix, watch the check go red, then restore it. All three of these looked
correct and asserted nothing.

It also drives the responsive cascade end to end — set a phone override through
the real inspector, confirm a `max-width:809px` rule is emitted, confirm the
desktop value is untouched and marked as overridden elsewhere.

It also drives the three drag paths, which is how one of them turned out never
to have existed: the layers tree carried a `dragId` through both its components
and a comment promising "buttons as well as dragging", and had no `draggable`
attribute and no drop handler anywhere in the file. From the outside it read as
finished. The checks now assert that the top row *is* draggable, that dragging
it reorders the page, and that the new order reaches storage — the tree is a
view of the flow, so moving a row in the tree that did not move the section
would be worse than not being able to move it.

**The page review** is checked in two halves, and the order matters. The half
that rots is the *quiet* one: a linter reporting findings on a page with nothing
wrong with it is wrong in the way that gets linters switched off, and no other
check here would notice. So "the home page reviews clean" runs first, before
anything else in the sweep touches the page. An earlier version ran it at the
end and blamed the rules for a section the sweep had added itself, two hundred
lines earlier.

The loud half needs blocks that are genuinely broken, and those are **seeded into
`localStorage` rather than built through the palette** — `blockDefaults` gives
every new block real starting content on purpose, so there is no way to create an
empty one from the UI. That is the product being right and the sweep needing
another door. The context is thrown away when the run ends, so the seed never
outlives it.

Two things not to hardcode in these checks:

- **The error count.** An earlier version asserted the publish warning said
  "2 things", which made it a record of how many steps happened to run before it —
  other checks in the same file add sections of their own. It now reads the count
  off the chip and asserts the dialog agrees, which is the more interesting claim
  anyway.
- **A wait long enough for an animation.** "Clicking a finding reveals its
  section" first failed because it slept 600ms while a smooth scroll took 1,600ms
  to cross the page. A fixed sleep tests the animation's speed, not the
  behaviour — poll until the element is on screen, and assert the *duration*
  separately if the duration is the point. Here it is: the check now requires a
  far jump to land in under 400ms, and that one fails at 992ms if the distance
  rule is removed.

`[data-review-row]` is the hook for finding rows, and it exists because the first
version counted `.mk-nav-item` — which is the sidebar's hover class. It reported
twelve findings on a clean page and every one of them was a navigation link.

**Section layouts** are checked for *reach*, not for the picker having buttons.
The mechanism resolves a section's chosen layout inside the one shared section
body, which is what makes it apply in all six templates, on the canvas and on the
published page without any template being touched — so these checks go looking in
places the feature was never explicitly wired to:

- **Across templates, not just the current one.** The first version of this check
  passed against the template in front of it and would have shipped a feature that
  did nothing in two of the six. Docs, Atlas and Manual render colour or type
  bodies of their own, and those were winning over the studio's explicit choice.
- **Both directions of the precedence.** A chosen layout must beat the template's
  own body, *and* the template's own body must come back on the default. Checking
  only the first would pass if someone "fixed" it by deleting the override
  mechanism.
- **That each layout renders something.** An attribute that changes while the
  section stays empty is a real risk here, because every layout is a separate
  component reading the same data. The check requires children and a height.

`data-layout` on every arrangement's root is what makes any of this checkable: the
page states which layout drew it. The alternative considered was measuring element
heights to tell a band from a card, which is a check that goes red every time
somebody changes a padding — a cost paid forever to avoid one attribute.

Telling a template's own colour body from the shared default needs its extra line
("copy its hex value"), because both legitimately draw `data-layout="cards"`.

**The responsive cascade, and the worst failure in this directory's history.**
Every assertion about a phone override used to be about the rule's *text*: find
`max-width:809px` in a `<style>` tag, pass. Nothing measured whether the page
changed — and it didn't. The rule was a `@media` query, which resolves against the
viewport, and the editor frames the page at 390px inside a 1600px window, so a
phone override was emitted correctly and applied nowhere. A green run of this file
coexisted with the feature being completely broken, and the line it printed at the
end said "a phone override applies at phone width and nowhere else".

The lesson is the one this file keeps relearning in new costumes: **asserting on
the artefact is not asserting on the behaviour.** A rule in a stylesheet, an
attribute on an element, a class name — all of them can be perfectly correct while
nothing happens on screen. The check now reads the overridden section's rendered
height, and there is a unit test that `emitNode` never emits `@media` at all.

**Section options** are driven through the real inspector, never through
`localStorage`. The whole point of that pass is that the controls are wired; a
check that wrote the store directly would pass with the panel disconnected. Two
traps met while writing them, both the check's fault and both instructive:

- **The frame's width is left wherever the previous block left it.** "Six per row
  produced 2 tracks" looked like a bug and was the right answer to a question the
  check hadn't meant to ask — the cascade block above had left the view switcher
  on phone. Set the breakpoint you mean to measure at, explicitly.
- **Whether a column count steps down is the interesting half.** Checking only the
  wide case would pass against an inline `grid-template-columns` that ignores the
  container entirely, which is what makes a six-across icon grid 50px per tile on
  a phone.

The palette drag is held rather than dropped for one check, so the canvas can be
asked what it is showing while the gesture is in flight. A landing strip that
only appears at the moment of release is a landing strip nobody can aim at.

Its first run reported five findings, three of which were the probe measuring
the wrong element: the page rendered inside the canvas has a language toggle
with the same accessible name as the editor's own. Scope a selector to
`[data-view-switcher]` before believing a finding about it.

### `board.mjs`
The lifecycle board: that every brand carries a plausible backfilled stage, that
the six columns name their counts for a screen reader, that stages move by
button as well as by drag (drag-and-drop alone excludes keyboard users), and
that the board scrolls without the page scrolling.

### `modals.mjs`
Every panel in the product, opened and then dismissed with the keyboard.

The app has one shared `Dialog` — the confirm and the prompt — and seven panels
that carry their own layout: the asset detail sheet, the colour editor, the
extract-from-logo reader, the two document importers, the logo preview and the
competitor-table builder. The shared one handled Escape and put the focus back;
none of the seven did. They could be left only by clicking the backdrop or
finding the ×, which is no exit at all on a keyboard and feels like being stuck
for everybody else.

It was written because a *probe* got trapped: a screenshot script pressed Escape
to close the asset sheet, the sheet ignored it, and everything after that timed
out against a backdrop intercepting clicks. Worth a suite of its own, because
Escape not working is the most common way an interface feels like a trap and
the least likely thing to be noticed by whoever built the panel.

It also checks that focus goes back to the control that opened the panel.
Without that, dismissing one drops the caret at the top of the document and the
next Tab starts again from the sidebar.

### `interaction.mjs`
Fifteen screens × both themes, measuring the things a screenshot cannot show.
Each check is one testable consequence of a rule that has a name:

| Check | Rule |
| :--- | :--- |
| Targets ≥ 24×24 CSS px | **Fitts's Law** (1954), as WCAG 2.2 SC 2.5.8 |
| Hovering changes something perceivable | Feedback; **Jakob's Law** |
| Focusing shows a ring | WCAG 2.4.7 / 2.4.11 |
| Transitions and animations under 400ms | **Doherty Threshold** (IBM, 1982) |
| The cursor matches what the thing is | **Jakob's Law** |
| A disabled control says why | **Zeigarnik effect** |
| `prefers-reduced-motion` actually stops motion | WCAG 2.3.3 |

The hover check is the one that earned this suite. It compares computed style
before and after a real pointer move — including `background-image`, which is
where this app's hover feedback lands, because controls are coloured with an
inline `background` that no stylesheet `background-color` rule can override. Its
first run found **145 distinct controls with no hover response at all**, in both
themes. One rule in `globals.css` fixed 500 of the 528 findings.

Some pages have nothing on them until something is made, so this sweep opens a
moodboard before auditing that page. Without it the whole canvas — its frames,
its cards and its tool palette — was never measured at all, and a clean result
was about a screen nobody uses.

Five guards keep it honest, every one added after it lied:

- It asserts `el.matches(':hover')` before judging. `boundingBox` ignores
  ancestor clipping, so a control scrolled out of the builder's canvas frame
  still has a box, and moving the mouse there hovers the frame instead.
- It measures `offsetWidth`, not `getBoundingClientRect`. The builder frames its
  canvas at a real viewport width and scales it to fit, so a 26px control paints
  at 20px and is still a 26px control.
- It **parks the pointer and blurs before taking a baseline.** Every check here
  compares before against after, so one element left under the cursor has its
  hover veil already in the baseline — and the sweep then reports the one
  control it can prove responds to hover as the only one that does not.
- It **presses `Tab` after any click it makes.** `:focus-visible` is a heuristic
  on the last input modality, and a click switches it to "pointer" for the rest
  of the session, after which every programmatic `.focus()` is correctly judged
  as not needing a ring. Opening a board reported 42 controls as having no focus
  ring, including sidebar links that pass on the fourteen pages this sweep does
  not click on.
- It builds its element list **once**. It used to run `querySelectorAll` twice —
  once for the descriptions, once to park the handles — and every check
  addresses an element by its index, so any DOM change between the two passes
  meant hovering element A and reporting it as element B.

`nwse-resize` and `crosshair` are honest cursors, not findings. Demanding
`pointer` of a resize corner is Jakob's Law enforced against itself.

### `surfaces.mjs`
Two questions the token audit cannot answer, because both are facts about the
*markup* rather than about `globals.css`: can you tell where a card is, and can
you see what is on it.

**Cards.** Every element that paints its own background on another one and is big
enough and round enough to be a card rather than a chip, measured against the
ground it actually paints on — walked up the tree and composited, because most
of these sit inside two or three transparent wrappers and asking the parent
returns `rgba(0,0,0,0)`. The property checked is not "the fill steps" but the one
that matters: by one route or the other, the boundary is findable. Either the
fill differs from the ground, or an edge drawn on it does. First run: **82**.

**Artwork.** Every image, with the file's own mean ink measured the same way
`lib/markTone.ts` measures it, against the surface behind it. An element
`AssetThumb` has already adapted says so with `data-adapted` and is judged on
where it ended up rather than where it started.

Inside `[data-guideline-surface]` it measures nothing. Those colours are the
*brand's*, a studio that chose a white-on-white brand has made a decision, and
overruling it is the in-app ContrastReport's job, not this one's.

It waits ~900ms per page before measuring. `AssetThumb` decides asynchronously —
it has to load and sample the file first — and a probe faster than the product
reports every thumbnail as unadapted. It opens a moodboard for the same reason
the interaction sweep does: that page is the most surface-heavy screen in the
product and has nothing on it until a board exists.

### `contrast.mjs`
Rendered contrast on every page and tab in both themes, measured against the
background actually painted rather than the token an element claims.

It applies two different bars, which is the part to understand before editing
it. App chrome carries **7:1 for text under 12.5px**, because 4.5 is calibrated
for ~16px and this UI sets a lot of 10px type. Inside `[data-guideline-surface]`
the colours are the *brand's*, and those carry **AA (4.5)** and no more —
pushing a studio's blue to AAA stops it being their blue. Anything above that
bar is surfaced to the studio by the in-app ContrastReport instead of being
silently rewritten.

Applying the chrome bar to brand surfaces produced 106 "findings" that were all
correct by design. If this file starts reporting a lot at once, check which bar
it is applying before changing any colour.

It also walks the **alternate section layouts**, in three rounds that set every
section's Nth layout at once. Those need measuring more than most surfaces here
because several of them set type directly *on* a client's own colour, where
`bestInkOn` has already taken the highest-contrast ink available — so any opacity
applied on top spends the only margin there is, and how much there was depends on
a colour this code has never seen. That is not hypothetical: the first draft faded
9px format labels to 0.6 and rendered **3.76:1** against a 4.5 bar, in both themes,
and this pass is what found it. Hierarchy on a brand-colour ground comes from
size, weight and tracking only.

The layout list is duplicated here rather than imported from
`lib/sectionVariants.ts`, so that dropping a layout from the registry makes this
sweep stop finding it instead of silently agreeing with itself. The round also
fails outright if no `[data-layout]` element rendered — a clean measure of a canvas
that never drew the layouts proves nothing, which is the standing trap in this
whole directory.
