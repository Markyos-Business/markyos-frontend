# The guideline token contract

**Frozen 16 October 2026.** Enforced by `npm run audit:tokens`
(`scripts/token-contract.mjs`), which runs inside `npm run check` and in CI.

Written for whoever builds the next thing that renders a brand — auto-compose,
the email-signature generator, the brand-templates kit, Mockup Studio. Revision
3.2 §11 item 9 asks for this contract documented and frozen, because all four
of those depend on it and none of them exists yet.

---

## 1. What the contract is

A guideline template never names a colour, a radius or a type size. It consumes
CSS custom properties, and something above it provides them. That indirection is
the whole reason one set of six templates can render any brand, in either
language, in light or dark, without a template knowing anything about the brand
it is drawing.

The contract has exactly two clauses:

1. **A template may consume only a token that is provided.** Consuming one that
   nothing emits resolves to nothing at runtime — a transparent card, a 0px
   radius, an invisible label — and it fails silently, on the client's site,
   in whichever template and whichever section nobody opened.
2. **Adding a token means adding it to an emitter.** Not to a template, not to
   a stylesheet.

The gate holds both. It reads every `var(--g-*)` under
`components/workspace/guideline/` and every `"--g-*":` in the two emitters, and
fails if the first set is not a subset of the second.

## 2. `BrandTheme` is the contract; `--g-*` is one serialisation of it

This is the part worth internalising before building anything new.

```
                 BrandTheme            (lib/theme.ts — the source of truth)
                  /        \
      themeCssVars()        deckTheme()
            |                    |
        34 --g-* tokens      DeckPalette
            |                    |
      7 templates             Deck only
```

Deck does not consume `--g-*` directly. It needs a two-accent system with its
own panel and rule tints, which the flat token set does not express — so it
derives a `DeckPalette` from the same `BrandTheme` instead.

**A new renderer should bind to `BrandTheme`, not to `--g-*`**, and then choose
its own serialisation. The gate has a check that fails if `deckTheme.ts` ever
stops deriving from `BrandTheme`, with the reason spelled out: once two things
that render a brand stop sharing one source, "the mockup looks different from
the site" becomes a bug nobody can locate.

## 3. The tokens

### 3.1 Emitted by `themeCssVars()` — 34, in `lib/theme.ts`

| Family | Tokens | Notes |
| :--- | :--- | :--- |
| **Plate** | `--g-plate-bg`, `--g-plate-shadow` | What brand artwork sits *on*: a logo tile, an icon tile, a swatch card, a specimen. **Always a real filled surface with a visible edge**, even under a design system whose content cards are outlined — see §4.2. |
| **Accent** | `--g-accent`, `--g-accent-soft`, `--g-accent-ink`, `--g-accent-on-soft` | `--g-accent-on-soft` exists because a tint lifts the ground toward the ink: an accent clearing 4.5:1 on a card lands near 4.36:1 on its own tint. A "PRIMARY" chip filled with `--g-accent-soft` must label itself with this, not with `--g-accent`. |
| **Ground** | `--g-canvas`, `--g-surface-1`, `--g-surface-2` | |
| **Ink** | `--g-text`, `--g-text-muted`, `--g-text-faint` | |
| **Edge** | `--g-hairline` | `--g-hairline-strong` is emitted only by `blockStyle` — see §3.2. |
| **Inverted** | `--g-invert-bg`, `--g-invert-ink`, `--g-invert-accent`, `--g-invert-hairline` | For a band that flips polarity against the page. |
| **Radius** | `--g-radius-sm`, `--g-radius-md`, `--g-radius-lg`, `--g-radius-pill` | |
| **Card** | `--g-card-bg`, `--g-card-shadow` | **One shadow token, not a ring plus a shadow.** The three card treatments are mutually exclusive, and `box-shadow: none, none` — what a two-token version produces for a filled card — is invalid and drops the whole declaration. |
| **Rhythm** | `--g-rhythm` | |
| **Display type** | `--g-hero-size`, `--g-hero-tracking`, `--g-hero-weight`, `--g-section-size` | |
| **Body type** | `--g-body-size`, `--g-lead` | |
| **Label type** | `--g-label-size`, `--g-label-tracking`, `--g-label-transform`, `--g-label-weight` | |

### 3.2 Re-emitted by `blockStyle()` — 12, in `lib/blockStyle.ts`

When a section carries its own background, the tokens have to be re-solved
against *that* ground rather than the page's, or ink chosen for the page ends up
on a colour the page does not have. `blockStyle` re-emits the subset that
depends on the ground: `--g-canvas`, `--g-surface-1`, `--g-surface-2`,
`--g-text`, `--g-text-muted`, `--g-text-faint`, `--g-hairline`,
`--g-hairline-strong`, `--g-card-bg`, `--g-card-shadow`, `--g-plate-bg`,
`--g-plate-shadow`.

**`--g-hairline-strong` is emitted only here**, and no template consumes it
directly — which is why the gate reports it as "provided but unused". That is
correct and not a leak: it exists for a card edge on a section with its own
ground, where `--g-hairline` is too faint to separate anything. See the
`--hairline-strong` note in the app's own system.

### 3.3 Re-pointed app tokens — 21

`themeCssVars` also re-points the *app's* own tokens inside the brand subtree:
`--canvas`, `--surface-0..3`, `--accent`, `--accent-text`, `--accent-soft`,
`--accent-ink`, `--accent-on-soft`, `--status-ink`, `--text`,
`--text-secondary`, `--text-muted`, `--text-faint`, `--hairline`,
`--hairline-strong`, `--success`, `--warning`, `--danger`, `--danger-ink`.

Two reasons, both learned the hard way:

- **Shared components.** `BlockRenderer` and the sign-off panel are used in both
  the admin UI and the guideline. They fill with `--accent` and ink with
  `--accent-ink`. Without re-pointing, a brand's accent button would be inked
  for *Markyos's* accent — a different colour, often the wrong polarity.
- **Status colours follow the page, not the editor.** The "Do" and "Don't"
  labels on a misuse panel are `--success` and `--danger`. A studio running a
  dark guideline while the app itself is on the light theme got the light
  theme's near-black green on a near-black page: **1.8:1, a label that is not
  there.** The polarity of the page is a property of the brand, not of which
  theme the studio happens to be in. Hue is preserved — green stays green on a
  "Do" panel, which is most of what those two labels are saying.

## 4. Rules a new renderer must keep

### 4.1 Consume, never hardcode

No hex, no `px` radius, no font size. If the value you need is not a token,
that is the signal to add one to an emitter — not to inline it.

### 4.2 Artwork gets a real ground

A plate is not negotiable. Outlining these was a mistake worth recording: a
transparent logo tile on a near-black page gives a reader no way to judge
clearspace or to see the mark's own edges, and a transparent swatch card makes
a near-black swatch **literally invisible**. The job of those sections is to
show artwork against a neutral ground.

### 4.3 Ink on a brand colour is never faded

Faded 9px labels on a brand colour measured **3.76:1 in both themes**. If text
sits on a brand fill, it uses the full-strength ink for that fill, not a muted
one. `scripts/sweeps/contrast.mjs` holds this against every template and every
alternate section layout.

### 4.4 Semantic, direction-relative, container-queried

Three rules that are really one rule — the page ships bilingually and
responsively, so nothing may assume a side or a viewport:

- `start` / `end`, never `left` / `right`. `scripts/no-physical-props.mjs`
  gates it across 242 files.
- `@container g-page`, never `@media`. The editor frames the page at 390px
  inside a 1400px window, so a media query is false exactly when it matters.
- `BlockStyle` is a small set of semantic choices, not free CSS.

### 4.5 Read brand data live

A renderer never stores a copy of a colour, a font or a mark. Change the palette
and every surface showing it updates — this is principle 1 for the pillars, and
it is why the 19 per-section layouts all read `ws.colors` rather than holding
swatches of their own.

## 5. What "frozen" means

| Change | Allowed | Why |
| :--- | :--- | :--- |
| Add a token | **Yes** | Add it to `themeCssVars`, and to `blockStyle` too if it depends on the ground. Nothing breaks: no existing consumer asks for it. |
| Consume an existing token in a new renderer | **Yes** | That is what the contract is for. |
| Rename a token | **No** | Every template consuming it breaks at once, silently, at render time. |
| Remove a token | **No** | Same, and the gate cannot catch a *published snapshot* that still references it. |
| Change a token's meaning | **No** | Worse than a rename, because nothing fails — it just renders wrong everywhere. |

Rename and removal are refused, not discouraged. A token is a public interface
between the emitters and every renderer, present and future, including whatever
is already serialised into a published snapshot on a client's site.

## 6. Current state

```
Guideline token contract — 35 provided, 34 consumed

  Vault 17 · Docs 14 · Studio·Atlas 9 · Studio·Prism 8
  Studio·Signal 16 · Manual 16 · Mosaic 16
  Deck — none directly (composed from shared parts)
```

Per-template counts differ because templates differ: Atlas and Prism lean on
their own layout and take fewer, Vault takes the most. A low count is not a
template under-using the system.

### A correction made while writing this

The gate carried an `APP_PROVIDED` exemption list of three tokens, on the claim
that "the app shell provides these to every surface". A repo-wide search found
otherwise: `--g-canvas` is real but emitted by both emitters already, so the
exemption was redundant; **`--g-section-bg` and `--g-section-ink` appeared
nowhere in the codebase except that list.**

An exemption for a token nothing provides is worse than no exemption. A
template writing `var(--g-section-bg)` would have been waved through as
satisfied and resolved to nothing at runtime — the gate telling a comfortable
lie about the one thing it exists to check. The list is now empty, and the
derivations report counts from each emitter separately rather than from the
union, which had been attributing `--g-hairline-strong` to `themeCssVars`.

---

## See also

| | |
| :--- | :--- |
| `lib/theme.ts` | `BrandTheme`, `themeCssVars`, the contrast solvers |
| `lib/blockStyle.ts` | Re-solving against a section's own ground |
| `components/workspace/guideline/surface.ts` | The helpers templates share |
| `components/workspace/guideline/templates/deck/deckTheme.ts` | The other serialisation |
| `scripts/token-contract.mjs` | The gate |
| `scripts/sweeps/contrast.mjs` | Rendered contrast, every template, both themes |
| `docs/STATUS.md` | What is built |
