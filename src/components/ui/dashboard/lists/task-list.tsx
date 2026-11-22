"use client";

import type { ReactNode } from "react";
import { cx as clsx } from "../shared/styles";
import { Tag } from "../../badge/tag";
import { useDashboardLocale } from "../shared/locale";
import IconTile, { type IconTileTone } from "../shared/icon-tile";
import WidgetStateView, { resolveWidgetState } from "../shared/widget-state-view";
import type { IconComponent, WidgetStateProps } from "../types";

export interface TaskListItemProps {
  title: ReactNode;
  /** Second line: brand, asset or team. */
  meta?: ReactNode;
  icon?: IconComponent;
  iconTone?: IconTileTone;
  /** Days until due (negative = overdue) → Days tag. */
  dueInDays?: number | null;
  /** End-side action: a small secondary Button or TextButton. */
  action?: ReactNode;
  className?: string;
}

/** One task: icon tile, title, meta, due Days tag and an optional action. */
export function TaskListItem({ title, meta, icon, iconTone = "brand", dueInDays, action, className }: TaskListItemProps) {
  const { t } = useDashboardLocale();
  return (
    <li className={clsx("flex items-center gap-3 py-3 first:pt-0 last:pb-0", className)}>
      {icon && <IconTile icon={icon} tone={iconTone} size="sm" />}
      <div className="min-w-0 flex-1">
        <p className="break-words text-body font-medium text-text">{title}</p>
        {meta && <p className="break-words text-caption text-text-muted">{meta}</p>}
      </div>
      {typeof dueInDays === "number" && <Tag tone={dueInDays < 0 ? "danger" : dueInDays === 0 ? "warning" : "neutral"}>{dueInDays < 0 ? t(`${Math.abs(dueInDays)} days overdue`, `متأخر ${Math.abs(dueInDays)} يومًا`) : dueInDays === 0 ? t("Due today", "مستحق اليوم") : t(`Due in ${dueInDays} days`, `مستحق خلال ${dueInDays} يومًا`)}</Tag>}
      {action && <div className="shrink-0">{action}</div>}
    </li>
  );
}

export interface TaskListProps extends WidgetStateProps {
  children?: ReactNode;
  /** Count used to decide the empty state. */
  count: number;
  label: string;
  className?: string;
}

/** Divided task list with loading / empty / error. */
export default function TaskList({ children, count, label, state, emptyMessage, errorMessage, onRetry, className }: TaskListProps) {
  const { t } = useDashboardLocale();
  const resolved = resolveWidgetState(state, count > 0);
  if (resolved !== "ready") return <WidgetStateView state={resolved} skeleton="list" emptyMessage={emptyMessage ?? t("Nothing due. You're all caught up.", "لا توجد مهام مستحقة.")} errorMessage={errorMessage} onRetry={onRetry} className={className} />;
  return (
    <ul aria-label={label} className={clsx("divide-y divide-hairline", className)}>
      {children}
    </ul>
  );
}
