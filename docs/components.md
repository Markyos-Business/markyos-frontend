# Dashboard component library

The components dashboard screens are built from. They are also on screen,
live, at **`/dev/components`**: every variant and state, with Light/Dark and
English/Arabic toggles. Run with `NEXT_PUBLIC_UI_GALLERY=1` to see it.

- The design rules are `docs/MARKYOS_UI.md`; the tokens are in
  `tailwind.config.js` and `tailwind/tokens.js`.
- The rest of the kit (Button, IconButton, Badge, Table, Tabs, overlays, form
  fields…) is documented in `docs/ui/components.md`. This file covers the
  dashboard pieces and the ones extended for them.
- The reference feature that uses all of them is
  `docs/features/admin-users.md`.

**Import** from the barrels: `@/components/ui`, `@/components/form` and
`@/components/layout`, never from a file inside them.

**Rules every component here follows**

- Theme tokens only, with no raw colours. They hold up in light and dark.
- Logical properties only, so RTL mirrors by construction.
- Line Awesome icons at 16, 18 or 22px.
- Weight 500 at most.
- Typed props with defaults, and a `className` passed through.
- The kit's own words (Retry, Clear filters, "3 selected"…) come from
  `UiStringsProvider`. Everything else comes in through props.

| # | Component | Path |
| --- | --- | --- |
| 1 | `AppLayout` (the app shell) | `layout/AppLayout` |
| 2 | `AppSidebar` | `layout/AppSidebar` |
| 3 | `AppTopBar` (the header) | `layout/AppTopBar` |
| 4 | `PageHeader` | `ui/PageHeader.tsx` |
| 5 | `StatCard` | `ui/card/StatCard.tsx` |
| 6 | `StatGrid` | `ui/card/StatGrid.tsx` |
| 7 | `TrendChip` | `ui/badges/TrendChip.tsx` |
| 8 | `ContentCard` | `ui/card/ContentCard.tsx` |
| 9 | `ChartCard`, `Chart`, `ChartLegend` | `ui/charts/` |
| 10 | `DataTable` | `ui/table/DataTable.tsx` |
| 11 | `Tag` | `ui/badges/Tag.tsx` |
| 12 | `StatusDot` | `ui/badges/StatusDot.tsx` |
| 13 | `CountBadge` | `ui/badges/CountBadge.tsx` |
| 14 | `Avatar`, `AvatarGroup` | `ui/primitives/` |
| 15 | `KeyValueList` | `ui/composites/KeyValueList.tsx` |
| 16 | `ActivityFeed` | `ui/composites/ActivityFeed.tsx` |
| 17 | `FilterBar` + `useUrlFilters` | `form/filter/`, `hooks/useUrlFilters.ts` |
| 18 | `SearchField` | `form/search/SearchField.tsx` |
| 19 | `DateRangeButton` | `form/date/DateRangeButton.tsx` |
| 20 | `SegmentedToggle` | `form/toggle/SegmentedToggle.tsx` |
| 21 | `EmptyState` | `ui/empty/EmptyState.tsx` |
| 22 | `ErrorState` | `ui/empty/ErrorState.tsx` |
| 23 | Confirm dialog: `useDialog().confirm` | `ui/overlays/Dialog.tsx` |
| 24 | `FormDialog`, `FormSheet` + `useZodForm` | `ui/overlays/` |
| 25 | Toasts: `useToast` | `ui/overlays/Toast.tsx` |
| + | `Button` `disabledReason`, `UiStringsProvider`, `formatDayMonth` | `ui/buttons`, `ui/i18n`, `ui/date` |

---

## Layout

### 1. `AppLayout`: the app shell

A sidebar beside one column holding the top bar and the page. The shell is
exactly one viewport tall and only the page scrolls. Below 768px the sidebar
becomes a drawer opened from the top bar's menu button.

| Prop | Type | Default |
| --- | --- | --- |
| `sidebar` | `ReactNode`, usually `AppSidebar` | none: full width |
| `topbar` | `ReactNode`, usually `AppTopBar` | |
| `dir` | `"ltr" \| "rtl"` | inherited |
| `children` | the page | |

**Do:** set `dir` from the person's language, so the drawer and the sidebar
mirror. **Don't:** put a second scroll container around the page.

```tsx
<AppLayout dir={isAr ? "rtl" : "ltr"} sidebar={<AppSidebar … />} topbar={<AppTopBar … />}>
  <PageContainer>{children}</PageContainer>
</AppLayout>
```

### 2. `AppSidebar`

The logo and area title, then sections of links, then pinned footer links and
an optional footer slot (e.g. the user card). It collapses to an 84px rail and
remembers that per `storageKey`.

| Prop | Type | Default |
| --- | --- | --- |
| `label` | landmark name | required |
| `title`, `titleHref` | the area's name and home | required |
| `sections` | `{ key, label?, items: { key, label, icon, href, active?, badge? }[] }[]` | required |
| `footer` | `SidebarItem[]` | `[]` |
| `footerSlot` | `ReactNode`, hidden on the collapsed rail | |
| `storageKey` | where the collapsed state is kept | required |
| `isAr` | Arabic wording for collapse | `false` |

The active item sits on the accent tint with an accent bar. `badge` is a count,
or a dot once collapsed. **Do:** keep labels to 1–3 words. **Don't:** add
icons outside the drawn set (`npm run audit:icons`).

### 3. `AppTopBar`: the header

84px and transparent. Breadcrumb, title and subtitle on the start side; an
optional search in the middle (hidden on phones); actions on the end.

| Prop | Type | Default |
| --- | --- | --- |
| `title` | `ReactNode` | |
| `subtitle` | `ReactNode`, e.g. "Welcome back, Nour" | |
| `breadcrumb` | `ReactNode` | |
| `search` | `ReactNode`, e.g. `<SearchField shortcut />` | |
| `right` | actions: theme toggle, language, notifications, avatar | |

**Do:** use 22px `IconButton`s for actions, each with a `label`.

```tsx
<AppTopBar title="Users" subtitle="Welcome back, Nour" right={<><ThemeToggle /><AccountMenu /></>} />
```

### 4. `PageHeader`

The page's title, description and breadcrumb, with secondary and primary
actions on the end. The actions stack under the title on phones.

| Prop | Type | Default |
| --- | --- | --- |
| `title` | `string` | required |
| `description` | `ReactNode` | |
| `breadcrumb` | `ReactNode`, above the title | |
| `actions` | primary buttons, last | |
| `secondaryActions` | quieter buttons, before `actions` | |

**Do:** use one primary action per page, verb first ("Invite user"). **Don't:**
put filters here; they belong in `FilterBar`.

```tsx
<PageHeader breadcrumb="Admin" title="Users" description="Manage who can use Markyos"
  secondaryActions={<Button variant="outline" icon={<Icon name="file-export" size={18} />}>Export</Button>}
  actions={<Button variant="primary" icon={<Icon name="user-plus" size={18} />}>Invite user</Button>} />
```

---

## Data display

### 5. `StatCard`

A framed number: the outer frame on `surface-2`, the inner panel on
`surface-1`. Above the value is a label; in the footer, a footnote and a trend.

| Prop | Type | Default |
| --- | --- | --- |
| `label` | `string` | required |
| `value` | `ReactNode`, already formatted ("1,284", "SAR 84,500") | required |
| `footnote` | `string`, e.g. "vs last month" | |
| `trend` | `{ direction, value, label? }`: a `TrendChip` | |
| `loading` | skeletons in place of value and footer | `false` |

**Do:** format the number before passing it in. **Don't:** put more than one
number in a card.

```tsx
<StatCard label="Total users" value="1,284" footnote="vs last month" trend={{ direction: "up", value: "12%" }} />
```

### 6. `StatGrid`

Lays out `StatCard`s: 4 across from 1280px, 2 from 640px, 1 on a phone.
`className` changes the column count (e.g. `xl:grid-cols-3`).

```tsx
<StatGrid>{cards}</StatGrid>
```

### 7. `TrendChip`

The change since the last period: an up or flat arrow on success-soft, or a
down arrow on danger-soft.

| Prop | Type | Default |
| --- | --- | --- |
| `direction` | `"up" \| "down" \| "neutral"` | `"neutral"` |
| `value` | `string`, "12%" | required |
| `label` | spoken text, "Up 12% on last month" | direction + value |

**Do:** pass a `label` that says what the change is against. **Don't:** use it
for a status; that is `StatusDot`.

### 8. `ContentCard`

The titled card most dashboard content sits in. It has a header (title,
legend slot, controls slot), a body and an optional footer.

| Prop | Type | Default |
| --- | --- | --- |
| `title` | `string` | |
| `legend` | beside the title: a `ChartLegend`, a `CountBadge` | |
| `controls` | on the end: tabs, a select, a button | |
| `footer` | `ReactNode` | |
| `flush` | no body padding, for an edge-to-edge table | `false` |

```tsx
<ContentCard title="Sessions" flush controls={<Button size="sm">Sign out everywhere</Button>}>
  <DataTable … />
</ContentCard>
```

### 9. `ChartCard`, `Chart` and `ChartLegend`

A bar, line or area chart drawn in SVG with tokens, not Recharts:

- dashed hairline gridlines and 11px muted axis labels;
- a tooltip on hover or keyboard focus (each point is focusable and named);
- round ticks (0/25/50/75/100);
- the time axis is not mirrored in RTL (spec §8).

`ChartCard` adds the card, legend and the four states.

| Prop (`ChartCard`) | Type | Default |
| --- | --- | --- |
| `title` | `string` | required |
| `kind` | `"bar" \| "line" \| "area"` | `"bar"` |
| `data` | `{ label, values: number[] }[]` | required |
| `series` | series names, in `values` order | required |
| `label` | the chart's accessible name | required |
| `height` | px | `220` |
| `format` | `(n) => string`, for axis and tooltip | `String` |
| `controls` | e.g. a period select | |
| `loading`, `error`, `onRetry`, `empty` | the states | |

Series colours run accent, success, warning, danger, info, indigo (spec §6.15).
**Do:** keep to 2–3 series. **Don't:** colour by meaning; series colours are
for telling lines apart.

```tsx
<ChartCard kind="area" title="Sign-ups" label="Sign-ups per month" series={["Studios", "Freelancers"]}
  data={[{ label: "Sep", values: [48, 30] }, { label: "Oct", values: [72, 35] }]} />
```

### 10. `DataTable<T>`

The dashboard table. It covers:

- sorting and row selection, with a bulk-action bar;
- pages of 10, 20 or 50, plus a rows-per-page select;
- a sticky header, row click (and Enter), and a ⋯ row menu;
- skeleton rows, an empty slot and an error with Retry;
- sideways scroll inside its own box on phones.

It sorts and pages on the client, unless you pass `sort` / `onSortChange` and
`paging` for the server to do it.

| Prop | Type | Default |
| --- | --- | --- |
| `label`, `itemLabel` | table name; rows plural ("users") | required |
| `columns` | `{ key, header, cell, sortValue?, sortable?, hideHeader?, className? }[]` | required |
| `rows` | `T[]`; `undefined` while first loading | required |
| `getRowId` | `(row) => string` | required |
| `getRowLabel` | names each row's checkbox and menu ("Select row: Omar Aziz") | |
| `loading`, `error`, `onRetry` | states | |
| `empty` | `ReactNode`, usually `EmptyState` | required |
| `onRowClick` | opens the row | |
| `rowActions` | `(row) => ActionItem[]`; an item can be `disabled` with a `reason` | |
| `selectable`, `selected`, `onSelectedChange` | selection | |
| `bulkActions` | `(ids, clear) => ReactNode`, the bar's buttons | |
| `sort`, `onSortChange` | `{ key, dir } \| null`: server sort | |
| `paging` | `{ page, pageSize, total, onPageChange, onPageSizeChange? }`: server pages | |
| `pageSizes` | `number[]` | `[10, 20, 50]` |
| `stickyHeader` | header stays while the body scrolls (body capped at 70vh) | `true` |

**Do:**

- Give every row a `getRowLabel`.
- Keep a refused action in the menu, disabled, with its `reason`.
- Hide less useful columns on narrow screens with `className`.

**Don't:** put buttons in a column with a visible header; use `hideHeader`.

```tsx
<DataTable label="Users" itemLabel="users" columns={columns} rows={data?.results} getRowId={(u) => u.id}
  getRowLabel={(u) => u.name} loading={loading} error={error} onRetry={reload}
  empty={<EmptyState icon="users" title="No users yet" description="Invite someone to give them access." />}
  selectable selected={selected} onSelectedChange={setSelected}
  bulkActions={(ids, clear) => <Button size="sm" onClick={() => deactivate(ids, clear)}>Deactivate</Button>}
  sort={sort} onSortChange={setSort} paging={paging} />
```

### 11. `Tag`

A soft label: the tinted fill with the hue as ink.

| Prop | Type | Default |
| --- | --- | --- |
| `tone` | `"primary" \| "success" \| "warning" \| "danger" \| "neutral" \| "indigo"` | `"neutral"` |
| `size` | `"sm"` (24px, table cells) `\| "md"` (36px) | `"sm"` |
| `icon` | an `Icon` before the label | |

**Do:** use it for categories (a role, a plan). **Don't:** use it for live
status; that is `StatusDot`.

```tsx
<Tag tone="primary">Admin</Tag>
```

### 12. `StatusDot`

A coloured 8px dot beside a muted label. Only the dot carries colour
(spec §6.8).

| Prop | Type | Default |
| --- | --- | --- |
| `tone` | any badge tone | `"neutral"` |
| `label` | the status in words | required |

**Don't:** show the dot without its word.

```tsx
<StatusDot tone="warning" label="Waiting to join" />
```

### 13. `CountBadge`

A solid danger pill for counts. It renders nothing at 0 and shows `99+` above
`max`.

| Prop | Type | Default |
| --- | --- | --- |
| `count` | `number` | required |
| `max` | `number` | `99` |
| `label` | spoken, "3 unread" | the number |

### 14. `Avatar` and `AvatarGroup`

`Avatar` shows a photo, or initials on a tint, with an optional presence dot.
`AvatarGroup` overlaps several and ends with a "+n" chip.

| Prop (`Avatar`) | Type | Default |
| --- | --- | --- |
| `initials` | `string` | required |
| `src` | photo URL; the initials show while it loads or if it fails | |
| `size` | px | `30` |
| `tone` | `"accent" \| "muted"` | `"muted"` |
| `presence`, `presenceLabel` | `"online" \| "busy" \| "away" \| "offline"`, and its word | |

| Prop (`AvatarGroup`) | Type | Default |
| --- | --- | --- |
| `people` | `{ id, initials, src?, name }[]` | required |
| `max` | drawn before "+n" | `4` |
| `size` | px | `28` |

```tsx
<Avatar initials="NH" size={40} presence="online" presenceLabel="Online" />
<AvatarGroup people={team} max={4} />
```

### 15. `KeyValueList`

Label and value pairs for a detail panel.

| Prop | Type | Default |
| --- | --- | --- |
| `items` | `{ label, value: ReactNode }[]` | required |
| `layout` | `"rows"` (side by side) `\| "grid"` (two columns from tablet) | `"rows"` |

**Do:** wrap emails and IDs in `<span dir="ltr">`.

### 16. `ActivityFeed`

A history list. Each item has a tinted icon tile, a title, a meta line and a
short time ("10m", "2d") with the full date in `<time dateTime>`.

| Prop | Type | Default |
| --- | --- | --- |
| `items` | `{ id, icon, tone?, title, meta?, time, dateTime? }[]` | required |

**Do:** word items in the reader's language before passing them in (see
`features/admin/utils/activity.ts`).

---

## Inputs and controls

### 17. `FilterBar` and `useUrlFilters`

The toolbar above a list: search first, then filters, then "Clear filters"
once any filter is set. It's a `search` landmark and wraps on narrow screens.
`useUrlFilters` keeps the values in the URL, so a filtered view can be shared,
reloaded or come back to with Back.

| Prop | Type | Default |
| --- | --- | --- |
| `search` | usually a `SearchField` | |
| `children` | `FilterSelectField`s, a `DateRangeButton` | |
| `active` | shows "Clear filters" | `false` |
| `onClear` | | |

`useUrlFilters(defaults)` returns:

- `values`, `page` and `active`;
- `set(key, value)`;
- `setMany(patch)`, for several at once, like a date range's two ends (two
  `set`s in a row would undo each other);
- `setPage(n)` and `clear()`.

Changing a filter returns to page 1.

```tsx
const filters = useUrlFilters({ q: "", role: "", from: "", to: "" });
<FilterBar active={filters.active} onClear={filters.clear}
  search={<SearchField label="Search users" shortcut onDebouncedChange={(q) => filters.set("q", q)} />}>
  <FilterSelectField label="Role" hideLabel value={filters.values.role} onChange={(e) => filters.set("role", e.target.value)} options={roles} />
  <DateRangeButton value={{ from: filters.values.from, to: filters.values.to }} onChange={(r) => filters.setMany({ from: r.from ?? "", to: r.to ?? "" })} />
</FilterBar>
```

### 18. `SearchField`

The underlined search field with a leading glyph.

| Prop | Type | Default |
| --- | --- | --- |
| `label` | accessible name | required |
| `onDebouncedChange` | called once typing pauses; the field keeps its own text | |
| `debounceMs` | | `300` |
| `shortcut` | ⌘K / Ctrl+K focuses it, with the hint shown | `false` |

It reports only real changes: not the text it started with. A pause always
reports to the latest callback, so a filter chosen during the pause isn't
overwritten. **Do:** remount it with a `key` to empty it after "Clear
filters".

### 19. `DateRangeButton`

An outlined button showing the range ("1 Oct – 28 Oct"), with a month
calendar popover:

- weeks start on Monday, with a weekday header;
- each day is named in full for screen readers;
- Apply and Clear buttons.

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `{ from?, to? }`, ISO dates | required |
| `onChange` | `(range) => void` | required |
| `label`, `placeholder` | | kit's "Date range", "Any time" |

### 20. `SegmentedToggle`

A two-way switch, such as List / Grid or Light / Dark.

| Prop | Type | Default |
| --- | --- | --- |
| `label` | the group's name | required |
| `off`, `on` | `{ label, icon? }` | required |
| `value`, `onChange` | `boolean` | required |

```tsx
<SegmentedToggle label="View" off={{ label: "List", icon: "list-ul" }} on={{ label: "Grid", icon: "th-large" }} value={grid} onChange={setGrid} />
```

---

## Feedback and overlays

### 21. `EmptyState`

An icon tile, one sentence and an optional action, with no illustration or
emoji. `description` is required, so an empty state always says how to fill
it.

```tsx
<EmptyState icon="search" title="No users match “Riyadh”." description="Try another name, or clear the filters."
  action={<Button size="sm" onClick={clear}>Clear filters</Button>} />
```

### 22. `ErrorState`

A failed load: what failed, and Retry. It has `role="alert"`.

| Prop | Type | Default |
| --- | --- | --- |
| `title` | | kit's "Something went wrong" |
| `message` | what failed, actionable | kit's generic line |
| `onRetry` | without it there's no Retry | |

### 23. Confirm dialog: `useDialog().confirm`

The app's confirm, promise based. It says what happens and lists what is lost.
For a destructive action it can ask you to type a phrase.

| Option | Type | Default |
| --- | --- | --- |
| `title`, `body` | | |
| `consequences` | `string[]`, "2 brands they own are deleted" | |
| `confirmLabel`, `cancelLabel` | | "Confirm", "Cancel" |
| `tone` | `"neutral" \| "danger"` | `"neutral"` |
| `confirmPhrase` | text to type before confirm enables | |
| `isAr` | Arabic chrome and direction | `false` |

```tsx
if (await confirm({ title: "Remove Omar Aziz?", tone: "danger", consequences, confirmPhrase: user.email, confirmLabel: "Remove" })) remove();
```

### 24. `FormDialog`, `FormSheet` and `useZodForm`

A form in a dialog (centred) or a sheet (from the end edge). It traps focus,
closes on Escape and returns focus to the opener, and shows a busy state while
submitting.

| Prop | Type | Default |
| --- | --- | --- |
| `open`, `title`, `description`, `submitLabel` | | |
| `cancelLabel` | | kit's "Cancel" |
| `onClose` | | required |
| `onSubmit` | resolve to see below | required |
| `variant` | `"dialog" \| "sheet"` (`FormSheet` sets it) | `"dialog"` |

What `onSubmit` resolves to decides what happens:

- nothing: the dialog closes;
- a string: it stays open and shows the message above the fields;
- `false`: it stays open quietly, because the fields already show their errors.

`useZodForm(schema, initial)` returns `{ values, set, errors, submit, reset }`.
`submit()` validates, puts each field's first message under it, and returns
the parsed values or null.

```tsx
const form = useZodForm(z.object({ email: z.email("Enter a valid email address.") }), { email: "" });
<FormDialog open={open} title="Invite user" submitLabel="Send invite" onClose={close}
  onSubmit={async () => { const v = form.submit(); if (!v) return false; await invite(v.email); }}>
  <InputField label="Email" value={form.values.email} error={form.errors.email} onChange={(e) => form.set("email", e.target.value)} />
</FormDialog>
```

### 25. Toasts: `useToast`

`showToast(message, "default" | "success" | "danger")` runs after every save,
delete or update. The toasts are themed with tokens and announced.

---

## Kit additions made for the dashboard

- **`Button disabledReason`:** an action you can't take right now. The button
  stays focusable (`aria-disabled`), ignores clicks, and shows the reason as
  its tooltip. A plain `disabled` button can't be focused, so it can't explain
  itself.

  ```tsx
  <Button variant="danger" disabledReason={lastAdmin ? "Markyos needs at least one active admin." : undefined}>Remove</Button>
  ```

- **`ActionsDropdown`:** `iconOnly` for a row's ⋯ menu. Items take
  `disabled` and `reason`.
- **`UiStringsProvider` / `useUiStrings`:** the kit's built-in words in `en`
  or `ar`. Wrap a screen in `<UiStringsProvider lang={lang}>`.
- **`formatDayMonth(date, lang, withYear?)`:** "12 Sep" or "12 Sep 2026" (never
  "Sept", never US order), with Western digits in Arabic.
- **Tokens:** an `indigo` / `indigo-soft` pair for the sixth tag and chart
  colour, passing the contrast audit in both themes.
- **Icons:** arrow-circle-up/down, minus-circle, sort, sort-up, sort-down,
  calendar, ellipsis-v, file-export, filter, user-plus, user-slash,
  user-check, user-shield, laptop and chart-bar.
