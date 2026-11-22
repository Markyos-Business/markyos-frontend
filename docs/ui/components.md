# Components

Shared, domain-free building blocks. Import from the folder barrel
(`@/components/ui`, `@/components/ui`, `@/components/ui`), never from a
file inside it. The one exception is media (`@/components/ui/media`), which
stays out of the main barrel because it imports from it.

Before writing a component, look here: if one of these fits or can be
extended, use it. The dashboard pieces (StatCard, ChartCard, DataTable,
FilterBar, FormDialog and the rest) are documented in `docs/components.md`,
and shown live at `/dev/components`.

## Buttons — `ui/buttons`

### `Button`

```tsx
<Button variant="primary" onClick={save}>Save</Button>
<Button variant="secondary" size="sm" icon={<Icon name="plus" size={16} />}>Add asset</Button>
<Button variant="ghost" href="/reset">Forgot?</Button>
```

| Prop | Type | Default |
| --- | --- | --- |
| `variant` | `"primary" \| "secondary" \| "ghost" \| "danger"` (docs/MARKYOS_COMPONENTS.md) | `"secondary"` |
| `size` | `"sm" \| "md" \| "lg"` for labelled buttons; `"xs"` only for icon-only buttons — see the sizes table under Form controls | `"md"` |
| `icon` / `iconEnd` | `ReactNode`, an `Icon` before / after the label (16 at xs and sm, 18 at md and lg) | |
| `active` | keeps the hover scrim on, for the current choice | |
| `block` | fills the width | |
| `href` | `string`: renders a Next `Link` instead of a `<button>` | |
| `loading` / `status` | `"loading" \| "success" \| "error"` swaps the label for the state, without the button changing width | |
| `disabledReason` / `locked` | disables it and says why in a tooltip | |
| `className` | adds layout classes; never a height, corner or fill (the control audit refuses them) | |

Four variants, one job each (22 Nov 2026; the full rules are in
`docs/MARKYOS_COMPONENTS.md`): `primary` the area's one main action (accent
fill), `secondary` every other action (control ground with a hairline),
`ghost` quiet actions (transparent until hovered), `danger` a destructive
confirm. Corner `--control-radius`, height and side padding from the control
size, an 8px gap between icon and label. Hover and press are the `mk-btn`
scrim (ghost also takes a soft fill); focus is the 2px accent ring (it never
changes the corner); disabled keeps its variant's look at 45% opacity, so it
is never mistaken for an enabled button. Plus every native `<button>`
attribute.

### `IconButton`

```tsx
<IconButton icon="times" label="Close" onClick={onClose} />
<IconButton icon="plus" size="sm" shape="round" variant="soft" label="Add page" onClick={add} />
```

`icon` (icon name), `label` (required: the accessible name and tooltip),
`size` (the Button sizes; the button is square at each), `shape: "square" |
"round"`, `variant`: `quiet` (default, a bare glyph) or any Button variant.
`iconSize` is 16, 18 or 22.

## Feedback

### `AlertBanner` — a message about a whole form

```tsx
<AlertBanner message={error} />
```

Renders nothing when `message` is empty, so it can always be included. It has
`role="alert"`, so it's announced as soon as it appears.

### `useToast` — after every save, delete or update

```tsx
const { showToast } = useToast();
showToast("Brand saved", "success");
showToast("Brand deleted", "default", { label: "Undo", run: restore });
```

Variants `default | success | danger`. A toast with an action stays 7s,
otherwise 2.8s. It fades in, and out when dismissed.

### `useDialog` — confirm and prompt, instead of `window.confirm`

```tsx
const { confirm, prompt } = useDialog();
if (await confirm({ title: "Delete brand?", tone: "danger", consequences: ["Its share links stop working"] })) …
const name = await prompt({ title: "Rename", initialValue: brand.name });
```

`confirm` options: `title`, `body`, `consequences` (listed losses),
`confirmLabel`, `cancelLabel`, `tone: "neutral" | "danger"`, `confirmPhrase`
(the action stays disabled until it's typed), `isAr`. `prompt` takes
`label`, `placeholder`, `initialValue`, `hint` and the same `tone`: a
required answer that starts something destructive (the reason for ending a
plan) asks with `tone: "danger"`, so its action is red. Focus is trapped and
returned to the opener; Escape and the scrim cancel.

## Layout of a page

### `PageHeader`

```tsx
<PageHeader title="Users" description="62 accounts" actions={<Button>Invite</Button>} />
```

### `EmptyState` and `TableEmptyRow`

```tsx
<EmptyState icon="inbox" title="No drafts yet" description="Drafts appear here when a client suggests a change." />
```

`icon`, `title` and `description` are required, so a bare "No data" can't
compile. An `action` is optional. Inside a table use `TableEmptyRow` with
`colSpan`, `title` and `description`.

### `Table`

```tsx
<Table label="Users" columns={[{ key: "name", label: "Name" }, { key: "role", label: "Role", className: "hidden md:table-cell" }]}>
  {loading ? <TableLoadingRow colSpan={2} /> : rows.map((r, i) => <tr className={rowClasses} …><td className={cellClasses}>…</td></tr>)}
</Table>
```

Reuse `rowClasses` and `cellClasses` so rows line up with the header. Rows
navigate on `<tr onClick>`. A cell with its own button calls
`e.stopPropagation()`.

### Badges — `ui/badges`

```tsx
<Badge tone="success" dot>Active</Badge>
<Badge tone="attention" size="md" icon={<Icon name="clock" size={12} />}>Due soon</Badge>
<SolidBadge tone="danger">3</SolidBadge>
<IconBadge icon="users" tone="info" />
```

There are seven tones: `neutral`, `info`, `accent`, `success`, `warning`,
`attention` and `danger`. All of them come from `ui/badges/variants.ts`
(`SOFT_`, `DOT_` and `SOLID_VARIANT_CLASSES`), use theme tokens, and are
checked by the contrast audit in both themes.

### `Tooltip`, `FilterChip`, `ActionsDropdown`, `AppDate`

```tsx
<Tooltip content="Visible to clients" side="end"><IconButton icon="eye" label="Visibility" /></Tooltip>
<FilterChip label="Dubai" onRemove={clear} />
<ActionsDropdown items={[{ label: "Delete", icon: "trash", tone: "danger", onSelect: remove }]} />
<AppDate value={brand.updatedAt} format="relative" locale={isAr ? "ar" : "en-GB"} />
```

- **`Tooltip`:** sides are `top`, `bottom`, `start` and `end`, so they mirror
  in Arabic. It shows on hover and on keyboard focus, and describes its
  trigger for screen readers.
- **`ActionsDropdown`:** built on `Popover`.
- **`AppDate`:** renders a `<time>` element. Formats are `month`,
  `month-year`, `short`, `long`, `datetime` and `relative`.

### `Tabs`, `Faq`, `AsyncStateView`

```tsx
<Tabs label="Brand" tabs={[{ key: "overview", label: "Overview" }]} active={tab} onChange={setTab} />
<Faq items={[{ question: "…", answer: "…" }]} allowMultiple />
<AsyncStateView status={getAsyncStatus(loading, error, rows, (r) => !r.length)} skeleton={<TableLoadingRow colSpan={4} columns={4} />} emptyTitle="No brands yet" emptyDescription="Create one to start." onRetry={reload}>…</AsyncStateView>
```

- **`Tabs`:** the spec's tabs, 40px: `variant="text"` (the active tab on a
  raised pill) or `"icon"` (solid accent, overline label). Items may carry an
  `icon`.
- **`Faq`:** opens at once; the open card takes the accent edge.
- **`AsyncStateView`:** covers loading, error with Retry, empty, and the
  content.

### `StatTile`, `Badge`

```tsx
<StatTile value={62} label="Accounts" />
<Badge tone="success">Active</Badge>
```

Badge tones are `neutral | info | accent | success | warning | attention |
danger`, from the shared map in `ui/badges/variants.ts`, checked by the
contrast audit. `size="sm"` is the spec's 24px Badge, `size="md"` its 36px
Tag, and `dot` draws the 28px StatusTag, where only the dot carries the tone.

### `Skeleton`

```tsx
<Skeleton className="h-4 w-full rounded-lg" />
```

A skeleton shaped like the content, with a soft shimmer.

### Settings building blocks — `ui/composites/SectionUI`

`Section` (`title`, `icon`, `right`) is the card every settings page is made
of. `Row` (`label`, `hint`, `right`) is one line of it. `Switch` (`checked`,
`onToggle`, `label` required). `EmptyHint` is a quiet empty note.
`EditableField` is a value you click to edit, plain or rich. All of them
import from `@/components/ui`.

### Tabs — `TabIndicator`

```tsx
<button className="relative isolate rounded-lg …" onClick={() => setTab(key)}>
  {active && <TabIndicator />}
  {label}
</button>
```

The active tab's raised pill (or `variant="underline"`, a bar), for a tab row
built by hand. It doesn't travel between tabs.

## Overlays — `ui/overlays`

`Popover` (`button`, `label`, `align: "start" | "end"`, `width`, and
`children(close)`) is a menu anchored to its trigger. It isn't modal, closes
on outside click and Escape, and crossfades in and out.

## Primitives — `ui/primitives`

`Icon` (`name`, `size`; see `tailwind/icons.js`; the icon audit fails on a
missing name). `Avatar` (`initials`, `size`, `tone: "muted" | "accent"`).
`AutoTextarea` is a textarea that always fits its content. `LangToggle` is
the EN | ع segmented control (`value`, `onChange`, `size`, `label`).
`SwitchMark` (`checked`) is the switch as drawn, shared by `Switch` and the
form toggles; the control around it carries the state.

## Rich text and media

`RichText` renders a rich value. `RichTextEditor` edits one. `toRichHtml`,
`richToPlainText` and `richIsEmpty` are helpers. From
`@/components/ui/media`: `AssetThumb` is a thumbnail that plates itself when
it would vanish into its ground, and `BrandMark` is a brand's mark,
reversed or plated on dark grounds.

## Form controls — sizes, variants and states (UX-CON-001)

Every input, select, textarea, combobox, date picker and button reads one
token set (MARKYOS_UI.md §2.6), so controls of the same size share a height,
a corner and a focus treatment. Put controls that sit in one row at **one
size**: a `sm` field gets `sm` buttons.

| Size | Height | Side padding | Value / label | Fields | Buttons | On a touch screen |
| --- | --- | --- | --- | --- | --- | --- |
| `xs` | 28px (`h-ctl-xs`) | 10px | 12px | — | `Button`, `IconButton` | 28px look, 44px target |
| `sm` | 32px (`h-ctl-sm`) | 10px | 12.5px fields, 12px buttons | `size="sm"` | `size="sm"` | 44px |
| `md` | 40px (`h-ctl-md`) | 14px | 14px | default | default | 44px |
| `lg` | 46px (`h-ctl-lg`) | 18px | 14px | — | `size="lg"` (a page's one big action) | 46px |

| Control | Shape | Hover | Focus | Error / success / warning | Disabled | Read-only |
| --- | --- | --- | --- | --- | --- | --- |
| Fields: `InputField` and its kinds (`EmailField`, `PasswordField`, `NumberField`, `UrlField`, `PhoneField`, `SlugField`), `SearchField`, `TextareaField`, `SelectField` / `SelectInput`, `FilterSelectField` / `SortControl`, `ListboxCombobox`, the `select/` family, `DatePicker`, `TagInput` | `--control-bg` ground, 8px top corners, 1px `--control-border` underline | ground and underline step up | underline 2px accent (no ring, no shift) | underline in the state colour, note below in the same colour | disabled ground and ink | dashed underline, muted ink |
| `Button`, `IconButton` | variant fill, 8px corners | `mk-btn` scrim | 2px accent ring, 2px offset | `status="error"` shows "Try again" | fill kept, disabled ink, `disabledReason` tooltip | — |
| `SegmentedControl`, `SegmentedToggle`, `LangToggle`, `ThemeToggle` | pill track, chosen segment raised in the accent | scrim | ring | — | dimmed segment | — |
| `ActionsDropdown` | the outline button's look; `size="sm" \| "md"` to match its row | scrim | ring | — | per item, with a reason | — |

Spacing around controls is tokens too: `gap-ctl-icon` inside a control,
`gap-field-label` between a field and its label and note, `gap-ctl-row`
between controls in a row, `gap-field-stack` between fields in a form
(`FormGrid` and `Fieldset` take `density="compact"` for dense panels, 8px), and
`gap-form-section` between sections.

A labelled field with buttons beside it (Copy, Generate, Connect) goes in
`<div className="mk-field-row">`: the buttons line up with the input itself,
not with the bottom of the field's block, whether or not a hint or an error
shows. `SegmentedControl fullWidth` shares a narrow row between its options
and lets them shrink.

RTL: every control is written with logical properties; select arrows, input
icons and the action sheet mirror on their own. Contrast: the underline is
3:1 or better on every surface, the focus underline and ring 4.9:1, both held
by `scripts/contrast-audit.mjs`. `scripts/control-audit.mjs` refuses one-off
heights, corners, borders, backgrounds and row gaps on controls. Every
control in every size, variant and state is at `/dev/controls`.

## Form — `@/components/ui`

```tsx
<InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
<CheckboxField label="Stay signed in" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
<SelectField label="Role" hideLabel options={[{ value: "", label: "All roles" }]} value={role} onChange={…} />
<SearchField label="Search users" placeholder="Search name or email" value={q} onChange={…} />
```

`InputField` props:
- `label`
- `labelRight` (e.g. a "Forgot?" link)
- `error` (announced, and linked by `aria-describedby`)
- `hint`
- `size: "sm" | "md"` (32 / 40px; 44px on a touch screen)
- plus native input attributes

`inputClasses(error)`, `labelClasses` and `FieldNote` let a custom field, such
as `PasswordField`, match.

Every field below is controlled (`value` and `onChange`) and shares the same
label, `*` for `required`, hint and error as `InputField`:

| Field | What |
| --- | --- |
| `TextareaField` | A labelled multi-line box that can be made taller. |
| `SelectField`, `SelectInput` | A labelled select, or just the select. A value that matches no option shows as such. |
| `FilterSelectField`, `SortControl` | Selects for filter and sort bars, in the field shape, with an optional `icon`; an active filter takes the accent tint and underline. |
| `Combobox` | A select with search. Use `multiple` for several values and `emptyActions` for "Create …". It works with arrow keys, Enter and Escape. |
| `SearchableChecklist` | A checklist with search, "Select all shown" and Clear. Use `layout="chips"` for short labels. |
| `RadioField`, `RadioCardGroup` | One choice from a few, as tiles or as cards with a hint. |
| `ToggleField`, `ToggleCardGroup` | One setting, or several, as switch cards. The thumb goes to the reading end. |
| `SegmentedToggle`, `SegmentedControl` | Two named modes, or one choice from a few, as the kit pill. `SegmentedControl fullWidth` fills a narrow row. |
| `OtpField`, `PhoneField` | A one-time code with paste support, and a dial code plus number. Both stay left-to-right. |
| `ColorPicker`, `ColorField`, `ColorPopover` | The one colour picker: a saturation/brightness square, a hue track, HEX / RGB / HSL / CMYK fields (CMYK marked approximate), Copy, the screen eyedropper where the browser has one, and optional brand `swatches`. `ColorPicker` sits inline (a dialog), `ColorField` is the underline field that opens it, `ColorPopover` opens it from any trigger (an icon on a card). Never `<input type="color">`. |
| `RepeaterField` | A list of same-shaped rows, with add and remove. |
| `FileField` | Drop or browse with type and size checks. Use `variant="compact"` for forms with several uploads. The caller does the upload. |

## Layout — `@/components/ui`

| Component | What |
| --- | --- |
| `AppLayout` | The full-height shell: `sidebar`, `topbar`, page. Only the page scrolls. |
| `AppSidebar` | The collapsible sidebar: `sections` of `{ label, items }`, `footer` items, `storageKey`, `isAr` (`[` toggles it). |
| `AppTopBar` | Title on the start side, controls on the end. |
| `PageContainer` | The centred, padded, scrolling page body. |
| `PageTransition` | Wraps a route's content for the page transition; used by every `template.tsx`. |
| `Sidebar`, `TopBar` | The brand workspace's own, built on the above. |

## Hooks — `src/hooks`

| Hook | What |
| --- | --- |
| `usePresence(open)` | Keeps something mounted through its exit animation: `{ mounted, closing }`. |
| `useFileDrop({ onFiles })` | Drag-and-drop for a drop target: `{ isDragging, dropHandlers }`. |
| `useRequest(load, key)` | Loads data and reloads when `key` changes: `{ data, error, loading, reload }`. |
| `useModalDismiss(onClose)` | Escape closes, and focus returns to the opener. |
| `useLocalPref`, `useNarrowViewport` | A remembered preference, and whether the viewport is under 900px. |

## Gallery

To see every shared component on one page, in both directions and both
themes, build with `NEXT_PUBLIC_UI_GALLERY=1` and open `/design-system`. The
page doesn't exist in any other build.
