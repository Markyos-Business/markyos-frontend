import type { ReactNode } from "react";
import { Icon } from "../primitives/Icon";

type EmptyStateProps = {
  icon: string;
  title: string;
  /**
   * Required so an empty state always says what would be here and how to get
   * it; a bare "No data" fails type-checking.
   */
  description: string;
  action?: ReactNode;
};

/** What a page or card shows when it has nothing to list yet. */
const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  // Type and an icon, no illustration (spec §7).
  <div className="mk-surface flex flex-col items-center gap-space-3 rounded-card bg-surface-1 px-space-10 py-space-11 text-center">
    <Icon name={icon} size={22} className="text-text-muted" />
    <div className="text-body font-medium text-text">{title}</div>
    <p className="max-w-105 text-body text-text-muted">{description}</p>
    {action && <div className="mt-space-3">{action}</div>}
  </div>
);

export { EmptyState };
export type { EmptyStateProps };
