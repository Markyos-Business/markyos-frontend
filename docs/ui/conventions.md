# Conventions

## Where code lives

```
src/components/
  ui/          generic building blocks, no business logic (buttons/, badges/, empty/, loading/, …)
  form/        form fields (fields/, search/)
  layout/      the signed-in shell: AppLayout, AppSidebar, AppTopBar, PageContainer
  features/    one folder per business area: components/, hooks/, services/, types.ts, constants.ts
src/app/       routes, grouped: (auth), (studio), (admin), (public). Pages are thin.
src/hooks/     generic hooks
src/lib/       the API client and the data layer
```

- **Anything reusable and domain-free goes in `ui/`,** even if only one page
  uses it today. Never copy a component sideways between features: move it up.
- **A variant of a primitive sits next to it,** for example
  `ui/buttons/PillButton.tsx`.
- **One file per component,** flat in its folder, with an `index.ts` barrel
  per folder.

## Writing a component

```tsx
type BadgeTone = "neutral" | "success";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-3 text-text-muted",
  success: "bg-success-soft text-success",
};

type BadgeProps = {
  /** Doc comment on any prop that isn't obvious. */
  tone?: BadgeTone;
  children: ReactNode;
};

const Badge = ({ tone = "neutral", children }: BadgeProps) => (
  <span className={`h-badge rounded-xl px-2 text-caption font-medium ${tones[tone]}`}>{children}</span>
);

export { Badge };
export type { BadgeProps };
```

- **Types and exports:** a named `type XProps`, a `const` component, and named
  exports at the bottom. Never `export default`, except Next route files.
- **Variants:** one typed map of complete class strings per axis of
  variation, joined with a template string. No `clsx`, `cva`,
  `tailwind-merge` or `@apply`.
- **No dynamic class names.** Never build a class like `bg-${color}-600`;
  Tailwind only generates classes it finds written out.
- **`className` goes last and only adds.** For a real override, add a
  variant or a size.
- **Tokens, not values.** Use theme colours (`bg-surface-1`, `text-danger`),
  named sizes (`text-ui`), Tailwind's spacing and radius scale, and the named
  shadows and z-index layers. An arbitrary value usually means a token is
  missing: add it to the config.
- **Static styles go in classes.** Inline `style` only for values computed
  at runtime (a measured height, a user-chosen colour).
- **Logical properties** (`ms-`, `ps-`, `start-`, `text-start`), so the
  layout mirrors in Arabic. A deliberate physical value carries a
  `physical-ok:` comment.
- **Size:** under about 200 lines. Move logic into a hook first.
- **Comments** say why, not what.
- **Optional content:** a component that renders optional content returns
  `null` when it's empty.

## Accessibility

- **Landmarks:** use real ones (`<main>`, `<nav>`, `<section>` with a
  heading).
- **Labels:** icon-only controls need an accessible name (`IconButton`
  requires `label`).
- **Announcements:** messages that appear after an action get
  `role="alert"`.
- **Clickable things** are `<button type="button">` or links, never a bare
  `<div onClick>`.
- **Keyboard focus** shows the shared focus ring. Don't remove it with
  `outline-none` on anything focusable.

## Behaviour

- **Submit buttons:** `disabled={submitting}` only. Validate on submit and
  keep the values.
- **Edit forms:** also disabled until something changed
  (`disabled={submitting || !hasChanges}`).
- **Feedback:** every save, delete and update shows a toast.
- **Empty states:** always `EmptyState` or `TableEmptyRow`.
- **Loading:** use a skeleton shaped like the content.
- **Motion:** follow [motion.md](motion.md).

## Done means verified

- `npx tsc --noEmit`, `npx eslint src` and `npx vitest run` pass.
- The four audits pass (`npm run audit:contrast|tokens|logical|icons`).
- It's checked at phone width (no sideways scroll) and desktop, in light and
  dark, and in Arabic.
- A new user-facing flow gets a Playwright end-to-end test, and it's run.
