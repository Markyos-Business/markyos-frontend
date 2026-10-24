# Markyos UI Template — rules for Claude Code

> Put this file at your repo root as `MARKYOS_UI.md` and reference it from `CLAUDE.md`
> (`See @MARKYOS_UI.md for all UI work.`), or copy it into `.claude/skills/markyos-design/SKILL.md`.
> Source: *Markyos Design System — complete export, 20 Oct 2026*.
> **The token values below are the source of truth.** They follow the Oct 2026 dark art direction.
> Older readme prose that mentions `#5E81F4`, `#F5F5FA` or Lato describes the original light kit, so don't use those values.

---

## 0. What Markyos is

Markyos is a SaaS **digital asset management and brand governance** platform for the MENA market and
globally minded design studios. It has native **Arabic/English bidirectional** support: every asset, field, review
step and layout works in RTL and LTR from one build.

There are two visual layers. Keep them separate:

| Layer | Use for | Token prefix | Fonts |
|---|---|---|---|
| **Product UI** (dark) | The app: dashboards, asset library, review, billing | `--primary`, `--text-*`, `--space-*`… | Inter (+ Thmanya Sans for Arabic) |
| **Markyos Light** (marketing identity) | Website, social, campaigns, decks | `--mk-*` | Inter display / Bricolage Grotesque for brand; Thmanya Sans for Arabic |

Bricolage Grotesque is the **brand** face (wordmark, marketing display). Never use it in product chrome.

---

## 1. Hard rules (read before writing any UI)

1. **Use tokens, never raw hexes.** Every colour, size, radius and duration comes from a CSS variable in §2.
2. **One accent:** `--primary` `#0099FF`. Status colours are for status only; secondaries are for charts only.
3. **Flat surfaces.** Black canvas `#000`, panels `#111`, raised fills `#1A1A1A`. Use no gradients in chrome, no textures, no photography in chrome.
4. **Draw borders as inset box-shadows** (`box-shadow: inset 0 0 0 1px …`), not `border`. The only real border is the input underline.
5. **Depth comes from light, not shadow.** Glow (`--glow-*`) is used for active, focus and highlight only, on about 2% of a layout. `--shadow-raised` is for menus and overlays only.
6. **Hover and press use one treatment for everything:** a `--ink-35` scrim over the resting fill (`.mk-btn::after`). There is no lift, no scale and no darker hex.
7. **Focus** is `outline: 2px solid var(--primary); outline-offset: 2px`.
8. **Motion is minimal:** 120ms crossfades for colour, opacity and shadow, and 180ms for switch knobs and progress fills, with `cubic-bezier(.4,0,.2,1)`. There is no bounce, spring, entrance animation or parallax.
9. **The maximum weight is 500** in product UI (`--weight-bold: 500`). Hierarchy comes from size and white opacity, not from bold.
10. **Icons come only from Line Awesome 1.3.0.** There are no SVG icons, PNG icons, emoji or Unicode symbols as icons. Sizes are **16 / 18 / 22** only.
11. **Spacing is not a 4/8 grid.** Use the measured scale in §2.4, and don't round to 8.
12. **Component heights are fixed:** button 46, tab and pagination cell 40, input block 72, tag 36, status tag 28, badge 24, rail 84 wide, rail item 64, top bar 84, widget row 72.
13. **Radius encodes size class.** Pick it by component, not by taste (§2.5).
14. **Author in LTR and mirror with `dir="rtl"`.** Use logical CSS properties (`margin-inline-start`, `padding-inline`, `inset-inline-end`). Never let layout depend on string length.
15. **Never use emoji.** Not in UI, empty states or notifications.
16. **Don't use blur or frosted panels in product UI.** Don't put text over imagery. A label sits on an opaque card beside the image.

---

## 2. Tokens (paste into `src/styles/tokens.css`)

```css
/* ───────── Fonts ───────── */
@import url("https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..800&family=Lato:wght@300;400;700;900&family=Source+Sans+3:wght@400;600&display=swap");
@import url("https://cdn.jsdelivr.net/gh/icons8/line-awesome@1.3.0/dist/line-awesome/css/line-awesome.min.css");
/* Bricolage Grotesque (300–800 + Condensed 700) and Thmanya Sans (300/400/500/700/900)
   ship as local files in assets/fonts/ — declare @font-face for them. */

:root{
  /* ── Brand ── */
  --brand-black:#000000;
  --brand-white:#FFFFFF;
  --brand-blue:#0099FF;
  --brand-blue-deep:#0055FF;
  --on-accent:#FFFFFF;              /* text, glyphs, knobs on coloured fills */

  /* ── Base ramp (kit names, dark values) ── */
  --primary:#0099FF;                /* actions, focus, active, chart series 1 */
  --primary-deep:#0055FF;           /* pressed, glow falloff */
  --primary-dark:#FFFFFF;           /* the ink — white on black */
  --primary-grey:rgba(255,255,255,.6); /* secondary text */
  --secondary-indigo:#8A58FF;
  --secondary-cyan:#00CCFF;
  --secondary-cyan-alt:#22DDDD;
  --secondary-red:#FF0066;
  --secondary-green:#00DE68;
  --secondary-green-light:#4CD963;
  --secondary-yellow:#FFBB00;
  --secondary-violet:#9900FF;
  --indigo-ink:#A98BFF;

  /* ── Surfaces / lines ── */
  --white:#111111;                  /* card / panel surface (kit name kept) */
  --bg-light:#1A1A1A;               /* raised fill: inputs, table heads, resting tabs */
  --off-white:#161616;              /* unread / highlighted row */
  --outline:rgba(255,255,255,.10);
  --outline-resting:rgba(255,255,255,.10);
  --grey-200:rgba(255,255,255,.20);
  --grey-400:#333333;
  --grey-500:rgba(255,255,255,.4);

  /* ── Text ladder (hierarchy by opacity, never by hue) ── */
  --text-100:#FFFFFF;
  --text-80:rgba(255,255,255,.8);
  --text-60:rgba(255,255,255,.6);
  --text-40:rgba(255,255,255,.4);

  /* ── Tints: accent at ~14% on black ── */
  --primary-10:rgba(0,153,255,.14);
  --red-10:rgba(255,0,102,.14);
  --green-10:rgba(0,222,104,.14);
  --yellow-10:rgba(255,187,0,.14);
  --cyan-10:rgba(0,204,255,.14);
  --indigo-10:rgba(138,88,255,.16);
  --ink-10:rgba(255,255,255,.10);
  --ink-35:rgba(0,0,0,.35);         /* hover / press scrim */
  --bg-light-40:rgba(255,255,255,.04);

  /* ── Light (glow) ── */
  --glow-primary:0 0 6px #0099FF,0 0 24px rgba(0,153,255,.6),0 0 64px rgba(0,85,255,.4);
  --glow-soft:0 0 18px rgba(0,153,255,.35);
  --glow-line:drop-shadow(0 0 6px rgba(0,153,255,.8)) drop-shadow(0 0 18px rgba(0,85,255,.5));

  /* ── Semantic aliases — PREFER THESE in components ── */
  --text-heading:var(--primary-dark);
  --text-body:var(--text-80);
  --text-muted:var(--primary-grey);
  --text-inverted:#000000;
  --text-link:var(--primary);
  --text-on-primary:var(--on-accent);
  --surface-page:#000000;
  --surface-card:var(--white);
  --surface-panel:var(--white);
  --surface-sunken:var(--bg-light-40);
  --surface-inverted:#FFFFFF;
  --border-subtle:rgba(255,255,255,.05);
  --border-default:var(--outline-resting);
  --border-strong:var(--grey-200);
  --border-focus:var(--primary);
  --action-primary:var(--primary);
  --action-primary-scrim:var(--ink-35);
  --action-ghost-bg:var(--primary-10);
  --status-success:var(--secondary-green);
  --status-warning:var(--secondary-yellow);
  --status-danger:var(--secondary-red);
  --status-info:var(--secondary-cyan);
  --status-neutral:var(--primary-grey);
  --success-soft:var(--green-10);
  --warning-soft:var(--yellow-10);
  --danger-soft:var(--red-10);
  --info-soft:var(--cyan-10);

  /* ── Typography ── */
  --font-brand:"Bricolage Grotesque","Thmanya Sans","Lato",system-ui,sans-serif;
  --font-brand-condensed:"Bricolage Grotesque Condensed","Bricolage Grotesque","Thmanya Sans",system-ui,sans-serif;
  --font-ui:"Inter","Thmanya Sans","Lato",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --font-alt:"Source Sans 3","Source Sans Pro","Thmanya Sans",-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
  --font-arabic:"Thmanya Sans",system-ui,sans-serif;
  --font-features:"cv01","cv05","cv09","cv11";
  --font-icon:"Line Awesome Free","la-solid-900",sans-serif;
  --weight-light:300;
  --weight-regular:400;
  --weight-bold:500;                /* no bold — 500 is the heaviest UI weight */
  --weight-black:500;
  --size-h1:32px;  --lh-h1:48px;
  --size-h2:26px;  --lh-h2:40px;
  --size-h3:20px;  --lh-h3:32px;
  --size-h4:18px;  --lh-h4:27px;
  --size-h5:16px;  --lh-h5:24px;
  --size-body:14px;      --lh-body:21px;
  --size-secondary:12px; --lh-secondary:18px;
  --type-h1:var(--weight-bold) var(--size-h1)/var(--lh-h1) var(--font-ui);
  --type-h2:var(--weight-bold) var(--size-h2)/var(--lh-h2) var(--font-ui);
  --type-h3:var(--weight-bold) var(--size-h3)/var(--lh-h3) var(--font-ui);
  --type-h4:var(--weight-bold) var(--size-h4)/var(--lh-h4) var(--font-ui);
  --type-h5:var(--weight-bold) var(--size-h5)/var(--lh-h5) var(--font-ui);
  --type-body:var(--weight-regular) var(--size-body)/var(--lh-body) var(--font-ui);
  --type-body-bold:var(--weight-bold) var(--size-body)/var(--lh-body) var(--font-ui);
  --type-secondary:var(--weight-regular) var(--size-secondary)/var(--lh-secondary) var(--font-ui);
  --type-secondary-bold:var(--weight-bold) var(--size-secondary)/var(--lh-secondary) var(--font-ui);
  --type-button:var(--weight-bold) var(--size-body)/1 var(--font-ui);
  --type-overline:var(--weight-black) var(--size-secondary)/1 var(--font-ui);
  --overline-transform:uppercase;

  /* ── Spacing (measured, NOT a 4/8 grid) ── */
  --space-1:4px;  --space-2:5px;  --space-3:8px;  --space-4:10px;
  --space-5:14px; --space-6:18px; --space-7:19px; --space-8:25px;
  --space-9:26px; --space-10:32px; --space-11:40px;

  /* ── Component metrics ── */
  --control-h:46px;      /* plain & icon buttons */
  --control-h-sm:40px;   /* tabs, pagination cells */
  --field-h:72px;        /* input block incl. title + underline */
  --tag-h:36px;
  --status-tag-h:28px;
  --badge-h:24px;
  --rail-w:84px;
  --rail-item-h:64px;
  --rail-item-box:48px;
  --topbar-h:84px;
  --widget-row-h:72px;

  /* ── Shape ── */
  --radius-xs:1px;
  --radius-sm:4px;       /* checkbox, rail tile, chip */
  --radius-md:6px;       /* pagination cell, status tag */
  --radius-lg:8px;       /* buttons, tags, icon tiles */
  --radius-widget:15px;  /* widget rows */
  --radius-card:15px;    /* cards, counters */
  --radius-feature:25px; /* marketing feature cards */
  --radius-switch:12px;
  --radius-pill:100px;   /* radio, presence dots */
  --border-hairline:1px;
  --inset-primary:inset 0 0 0 1px #0099FF;
  --inset-outline:inset 0 0 0 1px rgba(255,255,255,.10);
  --inset-subtle:inset 0 0 0 1px rgba(255,255,255,.10);
  --shadow-card:0 0 0 1px rgba(255,255,255,.10);
  --shadow-soft:0 0 0 1px rgba(255,255,255,.08);
  --shadow-raised:0 0 0 1px rgba(255,255,255,.10),0 20px 40px rgba(0,0,0,.6); /* menus/overlays only */
  --ring-status:0 0 0 2px #111111;  /* presence-dot halo matches card */

  /* ── Motion ── */
  --ease-standard:cubic-bezier(.4,0,.2,1);
  --duration-fast:120ms;
  --duration-base:180ms;
  --transition-state:background-color var(--duration-fast) var(--ease-standard),
                     color var(--duration-fast) var(--ease-standard),
                     box-shadow var(--duration-fast) var(--ease-standard),
                     opacity var(--duration-fast) var(--ease-standard);
}
html{color-scheme:dark}
body{margin:0;background:var(--surface-page);color:var(--text-body);
     font:var(--type-body);font-feature-settings:var(--font-features);
     -webkit-font-smoothing:antialiased}
[lang="ar"],[dir="rtl"]{font-family:var(--font-arabic)}
```

### 2.1 Interactions (paste into `src/styles/interactions.css`)

```css
.mk-btn{position:relative;-webkit-tap-highlight-color:transparent}
.mk-btn::after{content:"";position:absolute;inset:0;border-radius:inherit;
  background:var(--ink-35);opacity:0;pointer-events:none;
  transition:opacity var(--duration-fast) var(--ease-standard)}
.mk-btn:hover:not(:disabled)::after,
.mk-btn:active:not(:disabled)::after,
.mk-btn.is-active::after{opacity:1}
.mk-btn:disabled::after{opacity:0}
.mk-btn:focus-visible{outline:2px solid var(--primary);outline-offset:2px}
.mk-linkbtn:hover{color:var(--primary)}
.mk-linkbtn:focus-visible{outline:2px solid var(--primary);outline-offset:3px}
a{color:var(--text-link);text-decoration:none}
a:hover{color:var(--primary-deep);text-decoration:underline}
```

### 2.2 The tint rule
Every soft fill is **its hue at ~14% over black**: ghost buttons, tag backgrounds, badges, icon tiles and the active rail item.
Use `--primary-10`, `--green-10`, `--red-10`, `--yellow-10`, `--cyan-10` and `--indigo-10`. Never invent "light blue" hexes.
Widget rows and sunken areas use `--surface-sunken` (white at 4%).

### 2.3 Colour roles at a glance

| Role | Token | Value |
|---|---|---|
| Page canvas | `--surface-page` | `#000000` |
| Card / panel | `--surface-card` | `#111111` |
| Raised fill (inputs, table head, resting tab) | `--bg-light` | `#1A1A1A` |
| Heading ink | `--text-heading` | `#FFFFFF` |
| Body | `--text-body` | white 80% |
| Secondary / muted | `--text-muted` | white 60% |
| Disabled / placeholder | `--text-40` | white 40% |
| Hairline | `--border-default` | white 10% |
| Accent | `--primary` | `#0099FF` |
| Success / warning / danger / info | `--status-*` | `#00DE68` / `#FFBB00` / `#FF0066` / `#00CCFF` |
| Chart-only extras | `--secondary-indigo`, `--secondary-violet`, `--secondary-cyan-alt` | — |

### 2.4 Spacing use
- Card padding is `--space-10` (32px) on view cards and `--space-8` (25px) on widgets.
- Gaps between stacked cards are 20px. Grid gaps for help articles and kanban columns are 20px.
- Row internal padding is `--space-6` horizontally (18px), and rows are `--widget-row-h` tall (72px).

### 2.5 Radius by component

| Radius | Components |
|---|---|
| 4px | checkbox, rail tile |
| 6px | pagination cell, status tag |
| 8px | buttons, tags, icon tiles |
| 10px | spark counter |
| 15px | cards, counters, widget rows |
| 12px | switch |
| pill | radio, presence dots, badge (oval) |

---

## 3. Typography

- **Product UI** uses **Inter** with `font-feature-settings: "cv01","cv05","cv09","cv11"`. Arabic falls through to **Thmanya Sans**.
- Weights are **400** for body and secondary text and **500** for every heading, value, label and button. Nothing heavier.
- The scale is fixed: **32 / 26 / 20 / 18 / 16** for headings, **14** for body and **12** for secondary, with the hard-coded line heights from §2.
- **Overline** (`--type-overline` + `text-transform: uppercase`) is the only place caps appear: tab labels (`LIST`, `GRID`), `SORT:`, `PREV`, `NEXT` and `VIEW ALL`. **Never type copy in caps.**
- **Values are weight 500 and units are 400:** `<b>42.6</b> Gb uploaded`, `<b>SAR 84,500</b>`.
- **Never track Arabic** (letter-spacing breaks joins). Arabic display line height is 1.3.

---

## 4. Icons

```html
<!-- Line Awesome: las = solid, lar = regular, lab = brands -->
<i class="las la-folder-open" style="font-size:18px;color:var(--primary)" aria-hidden="true"></i>
```

- **Sizes:** 16 for tabs, tag close and small meta. 18 for buttons, list rows and link buttons. 22 for the nav rail and top bar.
- **Colour:** `--text-muted` at rest, `--primary` when active or on a tint, `--on-accent` on primary fills, and the semantic hue for status glyphs.
- **Icon tile:** the glyph is centred on a 38–46px square with an 8px radius, filled with its hue's `*-10` tint.
- Directional glyphs (arrows, chevrons, sort, next/prev) **flip in RTL**. Logos and media controls never flip.
- If a glyph isn't in Line Awesome, **ask before drawing one.**

Common names include `tachometer-alt`, `briefcase`, `folder-open`, `images`, `search`, `bell`, `plus`, `plus-circle`, `filter`,
`ellipsis-h`, `arrow-right`, `angle-left`, `angle-right`, `list`, `th-large`, `cloud-upload-alt`, `language`, `check-circle`,
`calendar`, `file-invoice`, `cog`, `question-circle` and `envelope`.

---

## 5. App shell layout

```
┌──────┬───────────────────────────────────────────────────────────────┐
│ Rail │ TopBar (84px, transparent over #000)  title · search ⌘K · acts │
│ 84px ├───────────────────────────────────────────────────────────────┤
│ #000 │ [optional secondary panel ~600px, #111, own 84px header]       │
│      │ ┌─ SurfaceCard (#111, 15px radius, hairline) ───────────────┐ │
│ icons│ │ toolbar (tabs · sort · actions)                           │ │
│ 22px │ │ column header (12px muted, #1A1A1A or hairline below)      │ │
│      │ │ body (rows 72px / grid cards)                              │ │
│      │ │ pagination (flush to card padding)                         │ │
│      │ └───────────────────────────────────────────────────────────┘ │
└──────┴───────────────────────────────────────────────────────────────┘
Design width 1680×1020. One SurfaceCard per view.
```

- **Rail:** 84px wide, sticky and full height, with a 1px white-10% separator on the inline-end side. The logo mark sits at the top and the avatar at the bottom.
  - The active item is a 48px rounded square in `--primary-10`, plus a 2px `--primary` bar (with glow) on the rail's inline-end edge.
  - `expanded` turns it into a 240px sidebar with labels, counts and section headings.
- **TopBar:** 84px tall and transparent, holding the breadcrumb and title, a search field with a ⌘K hint, 22px icon actions and an initials avatar chip.
- **Responsive:** below about 1024px the secondary panel collapses. Below about 720px the rail becomes a bottom bar or drawer, toolbars wrap, and wide tables scroll inside an `overflow-x:auto` box.

---

## 6. Components — specs and reference markup

> If the codebase ships the React components (`window.MarkyosDesignSystem_93001f` or `components/**`), **import them; don't
> recreate them.** Prop contracts are listed below. Otherwise build them with the markup here.

### 6.1 SurfaceCard
`#111` with a 15px radius and a hairline drawn as an inset shadow, with no drop shadow. There is one per view; nest lists, tables and grids inside it.
```html
<section class="mk-card">…</section>
<style>.mk-card{background:var(--surface-card);border-radius:var(--radius-card);
  box-shadow:var(--inset-subtle);padding:var(--space-10)}</style>
```
Props: `padding?: number|string`

### 6.2 Button
46px tall with an 8px radius and a 14px label at weight 500. The icon is optional, 18px, and placed before the label.

| variant | Fill | Label |
|---|---|---|
| `primary` | `--primary` | `--on-accent` |
| `outline` | `--ink-10` + `--inset-outline` | `--text-heading` |
| `ghost` | `--primary-10` | `--primary` |
| `light` (marketing CTA only) | `#FFF` | `#000` |
| disabled | `--bg-light` | `--text-40` |

```html
<button class="mk-btn mk-button mk-button--primary"><i class="las la-plus" aria-hidden="true"></i>Add asset</button>
<style>
.mk-button{display:inline-flex;align-items:center;gap:var(--space-4);height:var(--control-h);
  padding-inline:var(--space-8);border:0;border-radius:var(--radius-lg);font:var(--type-button);
  cursor:pointer;transition:var(--transition-state)}
.mk-button i{font-size:18px}
.mk-button--primary{background:var(--primary);color:var(--on-accent)}
.mk-button--outline{background:var(--ink-10);color:var(--text-heading);box-shadow:var(--inset-outline)}
.mk-button--ghost{background:var(--primary-10);color:var(--primary)}
.mk-button:disabled{background:var(--bg-light);color:var(--text-40);cursor:not-allowed}
</style>
```
Props: `variant?: 'primary'|'outline'|'ghost'|'light'`, `icon?`, `iconStyle?: 'solid'|'regular'|'brand'`, `disabled?`, `active?` (permanent scrim), `block?`

### 6.3 ArrowButton
A 46×46 icon-only button for next/prev, add and toolbar affordances. It **must** have an `aria-label`.
Props: `variant?: 'primary'|'outline'`, `icon?` (default `arrow-right`), `disabled?`

### 6.4 LinkButton
A text-only action at 12px, weight 500 and uppercase, in `--text-muted` (or `--primary` for `tone="primary"`), with an optional 18px icon. Use it for `PREV`, `NEXT` and `VIEW ALL`.
Props: `icon?`, `tone?: 'muted'|'primary'`

### 6.5 Input (the only text-field shape)
There is **no box and no fill outside the dark field**. The block is 72px: a 12px muted title, a value at 14px weight 500, and a **1px underline**.
State is expressed **only by the underline colour**: default `--border-strong`, focus `--primary` (plus `--glow-soft`), error `--status-danger`, success `--status-success`.
An optional 18px icon sits on the left or right, and the hint text is 12px in the state colour.
```html
<label class="mk-field">
  <span class="mk-field__title">Project name</span>
  <input class="mk-field__input" placeholder="Start typing…">
</label>
<style>
.mk-field{display:flex;flex-direction:column;gap:var(--space-2);min-height:var(--field-h)}
.mk-field__title{font:var(--type-secondary);color:var(--text-muted)}
.mk-field__input{all:unset;font:var(--type-body-bold);color:var(--text-heading);
  padding-block:var(--space-3);border-bottom:1px solid var(--border-strong);transition:var(--transition-state)}
.mk-field__input::placeholder{color:var(--text-40);font-weight:400}
.mk-field__input:focus{border-bottom-color:var(--primary)}
.mk-field[data-state=error] .mk-field__input{border-bottom-color:var(--status-danger)}
.mk-field[data-state=success] .mk-field__input{border-bottom-color:var(--status-success)}
</style>
```
Props: `label?`, `state?: 'default'|'error'|'success'|'focus'`, `icon?`, `iconSide?: 'left'|'right'`, `hint?`, `disabled?`
Placeholders use the real ellipsis character: `Start typing…`

### 6.6 Checkbox / Radio / Switch
- **Checkbox:** 20×20 with a 4px radius. The label goes from muted to heading when checked. States are default, error and success.
- **Radio:** a 20×20 pill with the same states.
- **Switch:** 40×22. Off is a `--grey-400` track with a muted knob. On is a `--primary` track with an `--on-accent` knob. The knob moves in 180ms.
- Always use real `<input type="checkbox|radio">` elements with a `<label>`.

### 6.7 Tag
36px tall with an 8px radius and a 12–14px label at weight 500. **Only `primary` (solid `--primary`) and `grey` (solid `--bg-light`) are solid.**
Every other tone is its `*-10` tint with full-strength hue text. `removable` adds a 16px `times` glyph.
Props: `tone?: 'primary'|'grey'|'blue'|'lightblue'|'green'|'red'|'yellow'`, `removable?`, `onRemove?`

### 6.8 StatusTag
A 28px `--bg-light` pill with a 6px radius. **The text stays muted, and only the 8px dot carries colour.**
The status colours are: online green, busy red, away yellow, offline `--text-40`.
Props: `status?: 'online'|'busy'|'away'|'offline'`

### 6.9 Badge
24px tall and 30px wide, used for counts beside titles and nav labels. `oval` has a 12px radius and `round` has a 3px radius. The fill is a tint and the text is the hue.
Props: `shape?: 'oval'|'round'`, `tone?: 'green'|'red'|'yellow'|'primary'|'grey'`

### 6.10 ProgressBar
The track is 6px standalone and 4px inside counter cards, on `--ink-10`. The tone derives from the value: low is danger, medium is warning, high or full is success, and primary is `--primary`.
Props: `value 0–100`, `tone?`, `height?`

### 6.11 Tabs
- `text`: the active tab is a `--bg-light` pill with an `--inset-outline`.
- `icon`: the active tab is solid `--primary` with an uppercase overline label.
- Tabs are 40px tall.

Props: `items: {id,label,icon?}[]`, `value`, `onChange`, `variant?: 'text'|'icon'`

### 6.12 Pagination
40px cells with a 6px radius, placed inside the card and flush to its padding.
- `primary`: the active cell is solid `--primary`, with `PREV` and `NEXT` link buttons.
- `boxed`: `--bg-light` cells with arrows only.

Props: `page`, `pages`, `onChange`, `variant?: 'primary'|'boxed'|'fullsize'`

### 6.13 NavRail / TopBar
See §5.
- **NavRail props:** `items: ({id,icon,label,dot?,count?}|{section})[]`, `value`, `onChange`, `expanded?`, `logo?`, `footer?`. The logo is `assets/markyos-mark.svg`.
- **TopBar props:** `title?`, `breadcrumb?`, `onMenu?`, `search?: string|false`, `searchPlaceholder?` (`Search assets…`), `actions?: {icon,label,onClick?,dot?}[]`, `avatar?` (initials)

### 6.14 Widgets
- **ActivityRow:** a 72px row with an icon tile (tinted), a title in 14px weight 500, and right-aligned meta in 12px weight 500 (`10m`, `1hr`, `2d`). Props: `icon`, `title`, `meta`, `media?`, `tone?`
- **MessageRow:** an avatar with a presence dot (`--ring-status` halo), the name, a one-line excerpt and the time. Props: `name`, `excerpt`, `time`, `avatar?`, `status?`
- **MetricCounter:** a KPI card with a title, a description, a large value, a trend arrow and a 4px progress rule. Props: `title`, `description`, `value`, `trend?: 'up'|'down'`, `progress?`, `tone?`
- **NotificationItem:** an icon tile, title, description, time and unread dot. An unread row uses `--off-white`, a weight-500 title and a primary dot. Optional inline actions are allowed. Props: `icon`, `tone?`, `title`, `description?`, `time?`, `unread?`, `actions?`

### 6.15 Charts and tables
Charts **emit light**: glowing lines (`filter: var(--glow-line)`), bars that fade from blue to deep blue, and area fills that fade to black.
- **SparkCounter:** 98px tall with a 10px radius and a 178×48 sparkline. Props: `title`, `value`, `data[]`, `tone?`
- **BarGraph:** paired bars per column, primary against the comparison bar, on the sunken surface. Props: `title`, `description`, `series: [n,n][]`, `action?`
- **LineGraph:** a filled area curve, the widest widget on a report screen. Props: `title`, `description`, `data[]`, `labels[]`, `tabs?`, `tone?: 'primary'|'green'|'cyan'`
- **DonutChart:** 3–4 slices maximum, with the total large in the hole. Props: `title`, `total`, `slices: {label,value,display?,color?}[]`
- **TableWidget:** a `--bg-light` column header in 12px muted text; the first cell is weight 500. Props: `title`, `columns: {label,w?,align?}[]`, `rows`, `tabs?`, `footer?`, `total?`

Chart series order is primary `#0099FF`, then green `#00DE68`, yellow `#FFBB00`, red `#FF0066`, cyan `#00CCFF` and indigo `#8A58FF`.

### 6.16 Modules
- **CalendarMonth:** a Gregorian month grid with tinted event chips. `locale="ar"` gives RTL with Arabic-Indic digits. Props: `year`, `month (0–11)`, `events`, `selected`, `weekStart: 0|1|6`, `locale`, `maxPerDay`
- **KanbanColumn:** an accent-topped header, task cards (tag, title, progress, due date, comments, up to 3 assignee initials) and a dashed add button. Lay columns out with `gap: 20px`.
- **HelpCenterArticle:** an icon tile, a category overline, a title, a 3-line clamped excerpt and a read link. Use a 3-column grid with `gap: 20px`.

---

## 7. Content and voice

- **Voice** is plain, operational and declarative. Name the thing and stop: "Asset Library", "Rights expiring", "Needs Arabic", "Awaiting council".
  Don't use marketing verbs in the product, exclamation marks or personality tics.
- **Person:** labels, not sentences. Ownership is second-person possessive: "My assets", "Shared with me", "Your tickets".
  Never use "I" or "we" in the app.
- **Casing** is sentence case everywhere: "Asset details", "Add asset", "New invoice". Caps come only from the overline style.
- **Length:** field titles and buttons are 1–3 words, and buttons are verb-first ("Add task", "Mark all reviewed").
  Panel nav items get a title plus one clause: "Rights expiring" / "Licences ending in 30 days".
- **Empty and error states** are one sentence with no apology: `No topics match "rights".` Empty states use type and an icon, with no illustration.
- **Numbers:** relative time is `10m`, `1hr`, `2d`. Dates are `12 Sep` and `31 Dec 2026`, never US order. Currency looks like `SAR 84,500`. Show locales in full (`ar-SA`, `en-US`), never as flags.
- **Bilingual:** every user-facing string exists in `en` and `ar`. Arabic is written natively, not transliterated, and may be shorter.
- Use realistic MENA sample data: Riyadh, Dubai, Cairo, SAR, and names like Nour Haddad and Omar Aziz. Never use lorem ipsum.

---

## 8. RTL checklist

- [ ] Put `dir` and `lang` on `<html>` (or on a container) and use only logical properties (`inline-start/end`, `padding-inline`, `inset-inline`).
- [ ] Mirror directional icons with `[dir=rtl] .flip{transform:scaleX(-1)}` (or `--dir-flip:-1`).
- [ ] Keep logos, media controls and charts' time axes unflipped.
- [ ] Don't use `letter-spacing` on Arabic. Arabic display line height is 1.3.
- [ ] Use Western numerals unless the customer asks otherwise. CalendarMonth `locale="ar"` uses Arabic-Indic digits.
- [ ] Check that layouts survive strings that are 30% shorter or longer.

---

## 9. Marketing identity (Markyos Light) — only for website, social and campaigns

```css
:root{
  --mk-canvas:#000; --mk-panel-1:#111; --mk-panel-2:#1A1A1A; --mk-panel-3:#242424;
  --mk-text-1:#FFF; --mk-text-2:rgba(255,255,255,.8); --mk-text-3:rgba(255,255,255,.6); --mk-text-4:rgba(255,255,255,.4);
  --mk-line-strong:rgba(255,255,255,.2); --mk-line:rgba(255,255,255,.1); --mk-line-subtle:rgba(255,255,255,.05);
  --mk-fill-2:rgba(255,255,255,.1); --mk-fill-2-hover:rgba(255,255,255,.16);
  --mk-glass:rgba(255,255,255,.16); --mk-glass-blur:blur(12px);
  --mk-blue:#0099FF; --mk-blue-deep:#0055FF; --mk-blue-edge:#33B5FF;
  --mk-glow:0 0 6px #0099FF,0 0 24px rgba(0,153,255,.65),0 0 64px rgba(0,85,255,.4);
  --mk-glow-inset:inset 0 0 12px rgba(0,153,255,.5);
  --mk-glow-text:0 0 8px rgba(0,153,255,.9),0 0 28px rgba(0,85,255,.6);
  --mk-light-pool:radial-gradient(45% 45% at 50% 50%,rgba(0,85,255,.32) 0%,rgba(0,0,0,0) 70%);
  --mk-beam:0 0 12px #0099FF,0 0 40px #0055FF;
  --mk-data-bar:linear-gradient(90deg,#0099FF,#0055FF 45%,#000);
  --mk-state-approved:#00DE68; --mk-state-review:#8A58FF; --mk-state-rejected:#FF0066; --mk-state-info:#00CCFF;
  --mk-font-display:"Inter","Thmanya Sans",system-ui,sans-serif;
  --mk-font-text:"Inter","Thmanya Sans",system-ui,sans-serif;
  --mk-font-arabic:"Thmanya Sans",system-ui,sans-serif;
  --mk-weight-display:500; --mk-weight-text:400; --mk-weight-social:700;
  --mk-track-display:-0.04em; --mk-track-display-ar:0;
  --mk-lh-display:1.0; --mk-lh-display-2:1.1; --mk-lh-display-ar:1.3;
  --mk-d1:54px; --mk-d2:44px; --mk-d3:28px; --mk-d1-mobile:36px; --mk-d2-mobile:28px;
  --mk-t-lead:18px; --mk-t-caption:15px; --mk-t-ui:14px; --mk-t-meta:12px;
  --mk-r-chip:4px; --mk-r-button:8px; --mk-r-ui:15px; --mk-r-blog:20px; --mk-r-feature:25px; --mk-r-pill:999px;
  --mk-container:1100px; --mk-gutter:20px; --mk-section-y:100px; --mk-stack:60px; --mk-card-pad:25px;
  --mk-fade-bottom:linear-gradient(#000 55%,transparent 100%);
  --mk-fade-band:linear-gradient(transparent 0%,#000 25% 72%,transparent 100%);
  --mk-fade-end:linear-gradient(90deg,#000 60%,transparent 100%);
}
```
- Display text is weight 500, tracked −0.04em in Latin and 0 in Arabic. Sizes are 54/44/28 on desktop and 36/28 on mobile. **There is no bold on the website**; 700–900 is for social covers only.
- Use glow, neon edges and light pools as highlights only, on about 2% of the layout. Glass blur exists **only** in the marketing layer.
- State accents (approved, review, rejected, info) are for dots, tags and chart series, never for layout chrome.
- **Logos:** `markyos-wordmark.svg` (type only), `markyos-lockup.svg` (mark and type), `markyos-mark.svg` (rail and favicon).
  On a light ground, use `filter: invert(1)`. No other marks exist.

---

## 10. Don'ts (quick scan)

✗ Raw hex in a component · ✗ `font-weight: 600/700` in the product · ✗ `border: 1px solid` (use an inset shadow) ·
✗ Drop shadows on cards · ✗ Gradients or blur in product chrome · ✗ Emoji or SVG icons · ✗ Icon sizes other than 16/18/22 ·
✗ Rounding spacing to 8 · ✗ Bordered or filled input boxes outside the spec · ✗ Typed ALL-CAPS copy ·
✗ `margin-left`/`right` (use logical properties) · ✗ Bounce or entrance animations · ✗ Text over images ·
✗ Lorem ipsum · ✗ US date order · ✗ Bricolage Grotesque in the app UI · ✗ CraftUI or kit-author branding

---

## 11. Prompt recipe — how to ask Claude for a new screen

```
Build the <Screen name> screen following @MARKYOS_UI.md.
- Shell: NavRail (active: <id>) + TopBar title "<Title>" + one SurfaceCard.
- Card content: <toolbar: Tabs LIST/GRID, SORT>, <table columns …>, <pagination>.
- Optional secondary panel with nav items: <title / one-clause description / count>.
- Data: realistic MENA sample data, en + ar strings.
- Must work in dir="rtl". Tokens only. No new colours, sizes or icons.
```

## 12. Definition of done (Claude checks before finishing UI work)

- [ ] Only tokens from §2 are used; `grep -E '#[0-9a-fA-F]{3,6}'` finds nothing in component files.
- [ ] Heights, radii and icon sizes match §1.12, §2.5 and §4.
- [ ] Hover, press and focus use `.mk-btn` and the focus outline; transitions are 120 or 180ms only.
- [ ] Controls are real `<button>`, `<a>` and `<input>` elements with labels, and icon-only buttons have an `aria-label`.
- [ ] Text contrast is at least 4.5:1 (white 60% on `#111` passes; white 40% is for placeholders and disabled states only).
- [ ] The screen renders correctly with `dir="rtl" lang="ar"`.
- [ ] Copy follows §7: sentence case, no emoji, `10m`-style times and `12 Sep` dates.
