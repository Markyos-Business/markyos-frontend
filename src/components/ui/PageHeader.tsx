import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  /** The page's main buttons, on the end side. */
  actions?: ReactNode;
};

/** A page's title, a line under it, and its main actions. */
const PageHeader = ({ title, description, actions }: PageHeaderProps) => (
  <div className="flex flex-wrap items-end justify-between gap-space-5">
    <div>
      <h1 className="text-h1 font-medium text-text">{title}</h1>
      {description && <p className="text-body text-text-muted">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-space-4">{actions}</div>}
  </div>
);

export { PageHeader };
export type { PageHeaderProps };
