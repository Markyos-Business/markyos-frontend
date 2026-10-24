# Components

Shared, domain-free building blocks. Import from the folder barrel
(`@/components/ui`, `@/components/form`, `@/components/layout`), never from a
file inside it. The one exception is media (`@/components/ui/media`), which
stays out of the main barrel because it imports from it.

Before writing a component, look here: if one of these fits or can be
extended, use it.

## Buttons — `ui/buttons`

### `Button`

```tsx
<Button variant="primary" onClick={save}>Save</Button>
<Button variant="secondary" size="sm" icon={<Icon name="plus" size={15} />}>Add</Button>
<Button variant="link" href="/reset">Forgot?</Button>
```

| Prop | Type | Default |
| --- | --- | --- |
| `variant` | `"primary" \| "secondary" \| "ghost" \| "link"` | `"secondary"` |
| `size` | `"sm" \| "md" \| "lg"` (ignored by `link`) | `"md"` |
| `icon` | `ReactNode` | |
| `href` | `string`: renders a Next `Link` instead of a `<button>` | |
| `className` | adds classes; never use it to override a variant | |

Plus every native `<button>` attribute. Primary and secondary lift 1px onto a
soft shadow on hover and focus; `link` grows an underline from the
reading-start side. `PillButton` is the old name for `Button`, kept while
pages move over.

### `IconButton`

```tsx
<IconButton icon="times" label="Close" onClick={onClose} />
```

`icon` (icon name), `label` (required: the accessible name and tooltip),
`iconSize` (default 15). Grows to 105% on hover and focus.

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
otherwise 2.8s. It slides in, and fades out when dismissed.

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

### `StatTile`, `Badge`

```tsx
<StatTile value={62} label="Accounts" />
<Badge tone="success">Active</Badge>
```

Badge tones are `neutral | accent | success | warning | danger`, from the
shared map in `ui/badges/variants.ts`. Status badges are checked by the
contrast audit.

### `Skeleton`, `listItemMotion`

```tsx
<Skeleton className="h-4 w-full rounded-lg" />
{items.map((item, i) => { const m = listItemMotion(i); return <li key={item.id} className={m.className} style={m.style}>…</li>; })}
```

A skeleton shaped like the content, with a soft shimmer. `listItemMotion`
staggers a list in, 40ms apart and finished within 400ms.

### Settings building blocks — `ui/composites/SectionUI`

`Section` (`title`, `icon`, `right`) is the card every settings page is made
of. `Row` (`label`, `hint`, `right`) is one line of it. `Switch` (`checked`,
`onToggle`, `label` required). `EmptyHint` is a quiet empty note.
`EditableField` is a value you click to edit, plain or rich.

### Tabs — `TabIndicator`

```tsx
<button className="relative isolate …" onClick={() => startTransition(() => setTab(key))}>
  {active && <TabIndicator group="settings" />}
  {label}
</button>
```

The active tab's pill as its own element. When the change runs inside
`startTransition`, it slides to the tab you chose. Use one `group` name per
tab row.

## Overlays — `ui/overlays`

`Popover` (`button`, `label`, `align: "start" | "end"`, `width`, and
`children(close)`) is a menu anchored to its trigger. It isn't modal, closes
on outside click and Escape, and grows in and shrinks out.

## Primitives — `ui/primitives`

`Icon` (`name`, `size`; see `tailwind/icons.js`; the icon audit fails on a
missing name). `Avatar` (`initials`, `size`, `tone: "muted" | "accent"`).
`AutoTextarea` is a textarea that always fits its content. `LangToggle` is
the EN | ع segmented control (`value`, `onChange`, `size`, `label`).
`TextField` is the old name for `InputField`.

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
| `useRequest(load, key)` | Loads data and reloads when `key` changes: `{ data, error, loading, reload }`. |
| `useModalDismiss(onClose)` | Escape closes, and focus returns to the opener. |
| `useLocalPref`, `useNarrowViewport` | A remembered preference, and whether the viewport is under 900px. |
