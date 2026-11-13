# Motion

Motion in Markyos is smooth, calm and fast. The rules, tokens and the
per-component table live in [MARKYOS_UI.md §13](../MARKYOS_UI.md#13-motion);
this page is the how-to for code.

## Where things live

| What | File |
| --- | --- |
| Tokens, keyframes, utilities, reduced-motion swap, base rules (`.mk-collapse`, `.mk-stagger`, view transitions, sidebar width) | `tailwind/motion.js` |
| The same numbers for JS, shared variants, "a page just arrived" | `src/lib/motion.ts` |
| Keep something mounted through its exit | `src/hooks/usePresence.ts` — `usePresence(open, EXIT.fast \| base \| slow)` |
| Reduced-motion preference in JS | `src/hooks/usePrefersReducedMotion.ts` |
| Fade content in / stagger a group | `FadeIn`, `Stagger` (`src/components/ui/motion`) |
| Page transitions | `PageTransition` (`src`), used by each area's `template.tsx` |
| Sidebar remembered collapsed before paint | `src/lib/sidebarRails.ts` |
| Every transition, live | `/dev/motion` (needs `NEXT_PUBLIC_UI_GALLERY=1`) |

## Recipes

**Something that opens and closes** (a menu, a sheet, a dialog):

```tsx
const { mounted, closing } = usePresence(open, EXIT.base);
if (!mounted) return null;
return <div className={motionClass("dialog", closing)}>…</div>;
```

Pick the variant by job: `scaleIn` (menus, popovers), `dialog`, `slideFromStart`
/ `slideFromEnd` (sheets), `fadeIn`, `fadeUp`. Give a popover `data-side` and
it arrives from that side.

**Content that appears** (a card, a panel, data replacing a skeleton): wrap it
in `<FadeIn>`; a grid or list in `<Stagger>`. Both play once, on mount, and stay
still when they mount together with an arriving page.

**Something that opens to its own height** (an alert, an answer, a bar):

```tsx
<div className="mk-collapse" data-open={open} inert={!open}>
  <div>…</div>
</div>
```

**A transition on a property**: use the tokens — `transition-[rotate]
duration-base ease-standard` — never a number.

## Checks

- `grep -rnE "[0-9]+ms|cubic-bezier\(" src/components src/app` finds only comments.
- With the OS set to reduce motion, `/dev/motion` (or the "Reduced" switch on it) shows fades only.
- First load and theme switches play nothing.
