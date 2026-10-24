# Motion

Motion says what just happened: something arrived, left, moved, or was
pressed. It never decorates, never blocks a click, and nothing takes longer
than 400ms (the loading shimmer is the one ambient loop).

## The rules

1. **Tokens only.** Durations `fast` (150ms), `base` (250ms) and `slow`
   (400ms). Curves `ease-out` (entering), `ease-in` (leaving) and `ease-in-out`
   (moving in place). Never a raw number. See [tokens.md](tokens.md#motion).
2. **Leaving is faster than arriving.** Every exit uses `fast` and `ease-in`.
3. **Only transform and opacity move things.** State changes may also
   transition colour, background, border colour and box-shadow. Never animate
   width, height, top or left, and never write `transition: all`. (The one
   exception is a `<details>` accordion animating its own height.)
4. **Hover is for a real pointer.** `hover:` is defined as
   `(hover: hover) and (pointer: fine)`, so touch screens never get a stuck
   hover.
5. **Every hover has a focus-visible twin.** A keyboard user sees what a
   mouse user sees, plus the focus ring.
6. **Disabled things don't respond.** Use `not-disabled:hover:`.
7. **Reduced motion means no movement.** Transitions and animations drop to
   instant. Lift, scale and slide classes go under `motion-safe:`. View
   transitions are off. Fades may stay.
8. **Every animation ends at `transform: none`.** A leftover transform turns
   the element into a containing block for `position: fixed` children.

## What moves, and how

| Element | Behaviour | Where |
| --- | --- | --- |
| Every button and link | Colour, background, shadow and transform ease on `fast`; press squeezes to 97% | `tailwind/base.js` |
| Hover and focus veil | A tint over any button, link or summary | `tailwind/base.js` |
| `Button` primary and secondary | Lift 1px plus `shadow-soft` on hover and focus | `ui/buttons/Button.tsx` |
| `Button variant="link"` | Underline grows from the reading-start side | `ui/buttons/Button.tsx` |
| `IconButton` | Scales to 105% on hover and focus | `ui/buttons/IconButton.tsx` |
| Cards (`.mk-card`) | Lift 2px, accent edge and shadow on hover and focus | `tailwind/base.js` |
| Card images | Zoom to 104% inside the clipped well | `WorkspaceCard` |
| Inputs, selects, editors | Ring and fill ease on focus and error | `tailwind/base.js` |
| `Switch` | The knob slides by transform | `ui/composites/SectionUI.tsx` |
| Accordions (`<details>`) | Open at their real height; the chevron rotates | `tailwind/base.js` |
| `Popover` and menus | `dropdown-in` (fade plus scale from 0.95, from the trigger's corner); `dropdown-out` | `ui/overlays/Popover.tsx` |
| Confirm dialog | Scrim fades; panel `modal-in` from 0.96; faster `modal-out` | `ui/overlays/DialogHost.tsx` |
| Feature modals | `backdrop-in` plus `modal-in` | each modal |
| Drawers | Slide in from their own edge, out faster | `AdminUserPanel`, `DownloadPanel` |
| Tabs | The pill slides between tabs (`TabIndicator`); content cross-fades (`animate-tab-in`) | `TopBar`, account page |
| Toasts | `toast-in` slide and fade; fade out on dismiss | `ui/overlays/Toast.tsx` |
| Lists and grids | Items fade up, staggered 40ms (`listItemMotion`) | brands grid, admin users |
| Loading | `Skeleton` with a soft shimmer | `ui/loading/Skeleton.tsx` |
| Pages | Old page fades out (`fast`); new page rises 8px (`slow`) | `PageTransition` + `template.tsx` |
| Anchors | Smooth scroll; route changes still jump to the top | `html` + `data-scroll-behavior` |

## Adding motion to something new

- **Opens and closes:** keep it mounted through its exit with `usePresence`,
  then switch between `animate-*-in` and `animate-*-out`. While `closing`,
  add `pointer-events-none`.

  ```tsx
  const { mounted, closing } = usePresence(open);
  return mounted && <div className={closing ? "pointer-events-none animate-dropdown-out" : "animate-dropdown-in"} />;
  ```

- **Hover lift on a custom element:**
  `motion-safe:not-disabled:hover:-translate-y-px focus-visible:…`, with the
  colour and shadow classes outside `motion-safe:`.
- **A new animation:** add its keyframes and its `animation` entry to
  `tailwind.config.js`, built on the duration and easing tokens, and ending
  at `transform: none`.

## How it's built

There is no animation library. Enter and exit use CSS keyframes with
`usePresence`. Page transitions and the sliding tab pill use React's
`<ViewTransition>` (the browser's View Transitions API). It works in the
App Router with no configuration, and without browser support the page
simply swaps.
