import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  headingLevel?: 1 | 2 | 3;
  description?: ReactNode;
  /** Above the title: where this page sits, e.g. "Admin / Users". */
  breadcrumb?: ReactNode;
  /** The page's main buttons, on the end side. */
  actions?: ReactNode;
  /** Quieter buttons before the main ones (Export, Settings). */
  secondaryActions?: ReactNode;
};

/** A page's title, a line under it, and its actions; on a phone the actions drop under the title. */
const PageHeader = ({ headingLevel = 1, title, description, breadcrumb, actions, secondaryActions }: PageHeaderProps) => {
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3";
  return (
  <div className="flex flex-col gap-space-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
    <div className="min-w-0">
      {breadcrumb && <div className="mb-space-1 text-caption text-text-muted">{breadcrumb}</div>}
      <Heading className="text-h1 font-medium text-text">{title}</Heading>
      {description && <p className="text-body text-text-muted">{description}</p>}
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
