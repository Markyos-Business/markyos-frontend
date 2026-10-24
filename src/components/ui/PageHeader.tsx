import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  /** The page's main buttons, on the end side. */
  actions?: ReactNode;
};

/** A page's title, a line under it, and its main actions. */
const PageHeader = ({ title, description, actions }: PageHeaderProps) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="mb-1.5 font-display text-display font-semibold tracking-tight">{title}</h1>
      {description && <p className="text-ui-md text-text-muted">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2.5">{actions}</div>}
  </div>
);

export { PageHeader };
export type { PageHeaderProps };
