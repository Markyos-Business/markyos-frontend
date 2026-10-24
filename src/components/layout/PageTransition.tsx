import { ViewTransition } from "react";
import type { ReactNode } from "react";

type PageTransitionProps = { children: ReactNode };

/**
 * A route's content, animated on navigation through the View Transitions API:
 * the old page fades out fast, the new one rises 8px into place (the `.page`
 * rules in tailwind/base.js). Used by each route group's `template.tsx`,
 * which Next remounts on every navigation while the layouts around it stay.
 *
 * Only navigations run it, never the first load, so nothing starts hidden;
 * `default="none"` keeps it still during other transitions on the page (a tab
 * pill sliding). Without browser support the page simply swaps, as before.
 */
const PageTransition = ({ children }: PageTransitionProps) => (
  <ViewTransition enter="page" exit="page" default="none">
    {children}
  </ViewTransition>
);

export { PageTransition };
export type { PageTransitionProps };
