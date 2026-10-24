import type { ReactNode } from "react";

/** A page's title, a line under it, and its main actions. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="mb-1.5 font-display text-[32px] font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-[14px] text-text-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}
