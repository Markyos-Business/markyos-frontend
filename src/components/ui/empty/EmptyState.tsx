import type { ReactNode } from "react";
import { Icon } from "../primitives/Icon";

/** What a page or card shows when it has nothing to list yet. */
export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mk-surface flex flex-col items-center gap-2 rounded-card bg-surface-1 px-6 py-12 text-center">
      <Icon name={icon} size={22} className="text-text-faint" />
      <div className="text-[14px] font-semibold text-text">{title}</div>
      {hint && <p className="max-w-[420px] text-[12.5px] leading-normal text-text-muted">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
