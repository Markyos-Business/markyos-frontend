# Components

Shared, domain-free building blocks. Import from the folder barrel
(`@/components/ui`, `@/components/form`, `@/components/layout`), never from a
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
<Button variant="outline" size="sm" icon={<Icon name="plus" size={18} />}>Add asset</Button>
<Button variant="link" href="/reset">Forgot?</Button>
```

| Prop | Type | Default |
| --- | --- | --- |
| `variant` | `"primary" \| "outline" \| "ghost" \| "danger" \| "light" \| "link"` | `"outline"` |
| `size` | `"sm"` (40px) `\| "md"` (46px); ignored by `link` | `"md"` |
| `icon` | `ReactNode`, an 18px `Icon` before the label | |
| `active` | keeps the hover scrim on, for the current choice | |
| `block` | fills the width | |
| `href` | `string`: renders a Next `Link` instead of a `<button>` | |
| `className` | adds classes; never use it to override a variant | |

The spec's Button (MARKYOS_UI.md §6.2): 46px, an 8px radius, a 14px label at
weight 500. `primary` is the accent fill, `outline` the neutral tint with a
hairline, `ghost` the accent tint, `danger` the red fill for a destructive
confirm, `light` the white marketing call to action. Disabled is the raised
fill with the 40% ink. Hover and press are the `mk-btn` scrim; `link` just
underlines. Plus every native `<button>` attribute.

### `IconButton`

```tsx
<IconButton icon="times" label="Close" onClick={onClose} />
```

`icon` (icon name), `label` (required: the accessible name and tooltip),
`variant`: `quiet` (default, a bare glyph with a 26px hit area), or `primary`
/ `outline`, the spec's 46px ArrowButton. `iconSize` is 16, 18 or 22.

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
(the action stays disabled until it's typed), `isAr`. Focus is trapped and
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

## Form — `@/components/form`

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
- `size: "sm" | "lg"`
- plus native input attributes

`inputClasses(error)`, `labelClasses` and `FieldNote` let a custom field, such
as `PasswordField`, match.

Every field below is controlled (`value` and `onChange`) and shares the same
label, `*` for `required`, hint and error as `InputField`:

| Field | What |
| --- | --- |
| `TextareaField` | A labelled multi-line box that can be made taller. |
| `SelectField`, `SelectInput` | A labelled select, or just the select. A value that matches no option shows as such. |
| `FilterSelectField`, `SortControl` | Pill selects for filter bars, with an optional `icon`. |
| `Combobox` | A select with search. Use `multiple` for several values and `emptyActions` for "Create …". It works with arrow keys, Enter and Escape. |
| `SearchableChecklist` | A checklist with search, "Select all shown" and Clear. Use `layout="chips"` for short labels. |
| `RadioField`, `RadioCardGroup` | One choice from a few, as tiles or as cards with a hint. |
| `ToggleField`, `ToggleCardGroup` | One setting, or several, as switch cards. The thumb goes to the reading end. |
| `SegmentedToggle` | Two named modes with a sliding highlight. |
| `OtpField`, `PhoneField` | A one-time code with paste support, and a dial code plus number. Both stay left-to-right. |
| `RepeaterField` | A list of same-shaped rows, with add and remove. |
| `FileField` | Drop or browse with type and size checks. Use `variant="compact"` for forms with several uploads. The caller does the upload. |

## Layout — `@/components/layout`

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
