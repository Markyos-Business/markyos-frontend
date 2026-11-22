# Markyos components: buttons and fields

Decided 22 Nov 2026 (review item 3, UX audit M5). `docs/MARKYOS_UI.md` §6.2 is the
design summary; this is the rule book for code. The component is
`src/components/ui/button/button.tsx` (`Button`, `IconButton`, `buttonLook`).
Fields (input, select, textarea, in-place editors) follow from "Fields" below,
decided 22 Nov 2026 with the review's form-controls item.

## One button, four variants

| Variant | Use it for | Look |
|---|---|---|
| `primary` | The one main action of an area: Save, Publish / Update, Send, Create | Accent fill, white label |
| `secondary` | Every other action: Share, Import, Cancel, Add item, More | Control ground with a hairline edge, ink label |
| `ghost` | Quiet actions: toolbar and in-row icon buttons, "Add…" inside a list, Remove image | Transparent; a soft fill on hover and press. Icon-only ghost buttons draw the glyph in the muted ink |
| `danger` | A destructive action, after it asks (Delete, Remove, Revoke, Sign out) | Danger fill, white label |

**One primary per area.** An area is a page header, a dialog footer, a panel, a
toolbar. If two actions look equally main, one of them is secondary.

## Sizes

| Size | Height | Use |
|---|---|---|
| `sm` | 32px (44px on touch) | Toolbars, page-header rows, dense panels |
| `md` | 40px (44px on touch) | The default: forms, dialogs, cards |
| `lg` | 46px | Hero and full-width calls to action |
| `xs` | 28px (44px touch target) | **Icon-only** buttons inside dense rows (layers, table rows). A labelled button is never xs |

Buttons share their height with fields and selects of the same size, so a row
of controls lines up. Buttons in one row use one size.

## States

| State | How it looks |
|---|---|
| default | The variant's fill and label |
| hover | A faint scrim over the fill (ghost: a soft fill). None in chrome marked `mk-no-hover` |
| focus-visible | A 2px accent ring with a 2px offset; the corner never changes |
| active (pressed) | A slightly stronger scrim |
| disabled | The variant's own look at 45% opacity, no hover, `not-allowed` cursor. Use `disabledReason` so it says why in a tooltip (a `title` is never shown on a disabled button) |
| loading | `loading` / `status="loading"`: a clock and "Saving…" in place of the label, at the same width |

An enabled button never looks disabled: disabled is the only faded state, and
no variant uses the grey that disabled used to have.

## Icon-only buttons

`IconButton` takes the same variants and sizes (default `ghost`, `md`), is
square, and **requires** `label`, which becomes its `aria-label` and tooltip.
The ⋯ menu (`ActionsDropdown iconOnly`) is a ghost icon button of its size.

## Things that are not buttons

- **Choose-one controls** (Edit/Read, language, device, All/Unread) are the
  pill segments (`SegmentedToggle`, `SegmentedControl`, `LangToggle`); see
  MARKYOS_UI §2.5.
- **Links that navigate** are links; a link that looks like a button is
  `<Button href>`, never a styled `<a>`.
- **Cards, tiles and rows** that open something are not buttons.

## In code

```tsx
<Button variant="primary" onClick={save}>Save</Button>
<Button variant="secondary" size="sm" icon={<Icon name="share" size={16} />}>Share</Button>
<Button variant="ghost" size="sm" onClick={addRow}>Add objective</Button>
<Button variant="danger" onClick={remove}>Delete</Button>
<IconButton icon="trash" label="Delete page" size="sm" />
<Button variant="primary" disabledReason="Nothing has changed since the last publish.">Update</Button>
```

A control that has to be another element (a menu or popover trigger renders
its own `<button>`) takes `buttonLook(variant, size)` for the same classes.

`className` on a Button adds layout only (margins, width, alignment); never a
height, corner, fill, border or padding: `npm run lint:controls` refuses them.

## Fields: input, select, textarea, editors

One shape for everything you type into or choose from, the `.mk-field` class
on the form-control tokens (`docs/MARKYOS_UI.md` §2.6). Buttons and fields
share the corner token, the heights and the focus colour; they differ on
purpose in how they are drawn, so a field never looks like a button.

| | Field (input, select, textarea, editor) | Button |
|---|---|---|
| Corner | `--control-radius` (8px) on the top corners only | `--control-radius` on all four |
| Edge | a 1px `--control-border` underline (3:1); hover `-hover` | none (secondary has a hairline) |
| Ground | `--control-bg`; hover `--control-bg-hover`; disabled `--control-bg-disabled` | the variant's fill |
| Height | sm 32 / md 40 (44 on touch) | sm 32 / md 40 / lg 46, xs 28 icon-only |
| Focus | the underline at 2px in `--control-border-focus` | the 2px accent ring, 2px offset |
| Error / success / warning | the underline in `--control-border-error` / `-success` / `-warning` | — |
| Read-only | a dashed underline, muted value | — |

**Which component**

| Need | Use |
|---|---|
| A line of text (email, URL, phone, number, password, slug…) | `InputField` and its typed versions in `src/components/ui/field/` |
| Several lines | `TextareaField`; bare, auto-growing: `AutoTextarea` with `className="mk-field"` |
| Choose one / several | `SelectField`, `Combobox`, `FilterSelectField`, `SortControl`, or the `select/` pickers; all open the kit dropdown |
| Search | `SearchField` |
| Formatted text | `RichTextField` (labelled) or `RichTextEditor` |
| Click-to-edit text that reads as text until clicked | `EditableField` (`section-ui.tsx`); in dense rows `InlineTextField` |
| A cell in an editable grid | `AutoTextarea` or `<input>` with `mk-field mk-field-sm` |

**In-place editors are fields.** The read state of a click-to-edit value is
drawn as the field it opens (same ground, corners, underline and padding), so
it says "you can type here" and the text doesn't move when it opens. Never a
grey box with all four corners round: that is a card, not a field.

**Not fields:** canvas and document content (the builder canvas, moodboard
notes, the Overview document) keep their own look; "choose one" pills
(`SegmentedControl`) are §2.5's pill segments.

```tsx
<InputField label="Brand name" value={name} onChange={setName} />
<SelectField label="Role" value={role} options={roles} onChange={setRole} />
<AutoTextarea value={text} onChange={setText} className="mk-field w-full font-normal leading-prose" />
<EditableField label="Purpose" value={v} editing={on} onStart={…} onChange={…} onCommit={…} placeholder="…" />
```

## Enforcement

- `ButtonVariant` is `"primary" | "secondary" | "ghost" | "danger"`: an old
  variant name doesn't type-check.
- A raw `<button>` styled with its own classes outside `src/components/ui` is
  flagged (see the button lint rule in `scripts/`), so new ones go through the
  component.
- A round button (`shape="round"`) outside the kit is flagged by the same
  audit: every button takes the control corner, and only the floating action
  button is round.
- Hand-set corners, fills, borders, heights and padding on fields are refused
  by `npm run lint:controls`; `e2e/control-style.spec.ts` measures every field
  and button on the main screens in both themes and both directions.
