# Motion

Motion in the product is minimal ([MARKYOS_UI.md](../MARKYOS_UI.md) §1.8):
colour, opacity and shadow crossfade, a switch knob and a progress fill move,
and that is all. No bounce, spring, entrance animation, page transition or
parallax.

## The rules

1. **Two durations, one curve.** `duration-fast` (120ms) for colour, opacity
   and shadow; `duration-base` (180ms) for switch knobs and progress fills
   only. Everything runs on `ease-standard`, `cubic-bezier(.4,0,.2,1)`. A bare
   `transition` class already gets 120ms and the standard curve, so most call
   sites need neither class. Never a raw number.
2. **Nothing animates because it mounted.** A list, a card, a tab panel or a
   page appears at once. Only something that opens and closes on request
   (a menu, a dialog and its scrim, a drawer, a toast) crossfades, with
   `animate-fade-in` / `animate-fade-out`.
3. **Nothing moves position or size.** No lift, no scale, no slide, no
   rotating chevron (swap `angle-down` for `angle-up` instead). The exceptions
   are the two the spec names: a switch knob's `translate` and a progress
   fill's `scaleX`, both on `duration-base`. Never write `transition: all`.
4. **Hover and press are one scrim.** A button carries `mk-btn`: hover, press
   and the permanent `is-active` state lay `--hover-scrim` (black at 35% on
   dark) over the resting fill. Every other control gets the shared hover veil
   from `tailwind/base.js`. Hover applies only to a real pointer, so touch
   screens never get a stuck hover.
5. **Every hover has a focus-visible twin.** A keyboard user sees what a
   mouse user sees, plus the focus outline (2px accent, 2px offset). Text
   fields are the exception: their focus is the underline turning accent.
6. **Disabled things don't respond.** Use `not-disabled:hover:`.
7. **Reduced motion** drops every transition and animation to instant. The
   hover scrim and veil stay: they are feedback, not movement.

## What changes, and how

| Element | Behaviour | Where |
| --- | --- | --- |
| Every button and link | Colour, background, shadow and opacity crossfade on `fast` | `tailwind/base.js` |
| `Button`, `IconButton` (filled), pagination cells, icon tabs | The `mk-btn` scrim on hover, press and `active` | `tailwind/base.js` |
| Other controls | The hover veil, a tint of the label's colour | `tailwind/base.js` |
| `Button variant="link"` | Underline on hover and focus, no animation | `ui/buttons/Button.tsx` |
| Cards (`.mk-card`) | The edge turns accent on hover and focus; no lift, no shadow | `tailwind/base.js` |
| Text fields (`.mk-underline`) | The underline turns accent on focus, danger when invalid | `tailwind/base.js` |
| Switches | The knob slides 18px on `base` | `form/toggle/SwitchTrack.tsx`, `ui/composites/SectionUI.tsx` |
| Progress | The fill grows by `scaleX` on `base` | `form/upload/FileField.tsx` |
| Popover, menus, combobox | `fade-in` / `fade-out` | `ui/overlays/Popover.tsx`, `form/search/Combobox.tsx` |
| Dialogs and their scrim | `fade-in` / `fade-out` | `ui/overlays/DialogHost.tsx`, each feature modal |
| Drawers | `fade-in` / `fade-out` | `SidebarDrawer`, `AdminUserPanel`, `DownloadPanel` |
| Toasts | `fade-in`; `fade-out` on dismiss | `ui/overlays/Toast.tsx` |
| Tabs, FAQ, accordions | Switch at once | `ui/tabs/Tabs.tsx`, `ui/faq/Faq.tsx` |
| Loading | `Skeleton` with a soft shimmer (the one ambient loop) | `ui/loading/Skeleton.tsx` |

The client-facing guideline site (`/v/<slug>`) keeps its own section reveal
(`[data-reveal]` in `tailwind/base.js`). It is a brand's document, not
Markyos product chrome.

## Opening and closing something new

Keep it mounted through its exit with `usePresence` (120ms), and switch
between the two fades. While `closing`, add `pointer-events-none`.

```tsx
const { mounted, closing } = usePresence(open);
return mounted && <div className={closing ? "pointer-events-none animate-fade-out" : "animate-fade-in"} />;
```

There is no animation library: the two fades are CSS keyframes in
`tailwind.config.js`.
