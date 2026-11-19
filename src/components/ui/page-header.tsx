import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  headingLevel?: 1 | 2 | 3;
  description?: ReactNode;
  /** Above the title: where this page sits, e.g. "Admin / Users". */
  breadcrumb?: ReactNode;
  /** A short label above the title, e.g. "Brand strategy" over a brand's name. */
  eyebrow?: ReactNode;
  /** The page's main buttons, on the end side. */
  actions?: ReactNode;
  /** Quieter buttons before the main ones (Export, Settings). */
  secondaryActions?: ReactNode;
  className?: string;
};

/**
 * A page's title, a line under it, and its actions; on a phone the actions
 * drop under the title. Every authenticated page's title block is this one,
 * so each page has exactly one h1 and they all look alike.
 *
 * The title is bidi-isolated: a form, department or person named in another
 * script keeps its own word order without flipping the heading's alignment.
 */
const PageHeader = ({ headingLevel = 1, title, description, breadcrumb, eyebrow, actions, secondaryActions, className = "" }: PageHeaderProps) => {
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3";
  return (
  <div className={`flex flex-col gap-space-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between ${className}`}>
    <div className="min-w-0 sm:min-w-64 sm:flex-1">
      {breadcrumb && <div className="mb-space-1 text-caption text-text-muted">{breadcrumb}</div>}
      {eyebrow && <div className="mb-space-1 text-caption font-medium text-text-muted">{eyebrow}</div>}
      <Heading className="text-h1 font-medium text-text"><bdi>{title}</bdi></Heading>
      {description && <div className="max-w-[70ch] text-body text-text-muted">{description}</div>}
    </div>
    {(actions || secondaryActions) && (
      <div className="flex flex-wrap items-center gap-space-4">
        {secondaryActions}
        {actions}
      </div>
    )}
  </div>
  );
};

export { PageHeader };
export type { PageHeaderProps };
