# Changelog

What shipped, and the decisions taken along the way. Required by the build
spec's definition of done (§15).

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
