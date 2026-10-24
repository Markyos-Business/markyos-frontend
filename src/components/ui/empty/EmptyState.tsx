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
  <div className="mk-surface flex flex-col items-center gap-2 rounded-2xl bg-surface-1 px-6 py-12 text-center">
    <Icon name={icon} size={22} className="text-text-faint" />
    <div className="text-ui-md font-semibold text-text">{title}</div>
    <p className="max-w-105 text-ui-sm text-text-muted">{description}</p>
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export { EmptyState };
export type { EmptyStateProps };
