"use client";

import { useDashboardLocale } from "../shared/locale";
import type { ReactNode } from "react";
import { cx as clsx } from "../shared/styles";
import { Avatar } from "../../avatar/avatar";
import { initialsFor } from "@/lib/utils";
import StatusTag from "../shared/status-tag";
import WidgetStateView, { resolveWidgetState } from "../shared/widget-state-view";
import type { WidgetStateProps } from "../types";

export interface PeopleListItemProps {
  name: string;
  avatarSrc?: string | null;
  /** What they're working on, e.g. "Reviewing 4 brand assets". */
  work?: ReactNode;
  /** Stage id or status for the tag. */
  status?: string;
  statusLabel?: string;
  /** End-side action, e.g. a CardLinkButton. */
  action?: ReactNode;
  className?: string;
}

/** Avatar, name, current work and a status tag. */
export function PeopleListItem({ name, avatarSrc, work, status, statusLabel, action, className }: PeopleListItemProps) {
  return (
    <li className={clsx("flex items-center gap-3 py-3 first:pt-0 last:pb-0", className)}>
      <Avatar initials={initialsFor(name)} src={avatarSrc} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium text-text">{name}</p>
        {work && <p className="truncate text-caption text-text-muted">{work}</p>}
      </div>
      {status && <StatusTag status={status} label={statusLabel} />}
      {action && <div className="shrink-0">{action}</div>}
    </li>
  );
}

export interface PeopleListProps extends WidgetStateProps {
  children?: ReactNode;
  count: number;
  label: string;
  className?: string;
}

/** Divided people list (brand owners and collaborators) with loading / empty / error. */
export default function PeopleList({ children, count, label, state, emptyMessage, errorMessage, onRetry, className }: PeopleListProps) {
  const { t } = useDashboardLocale();
  const resolved = resolveWidgetState(state, count > 0);
  if (resolved !== "ready") return <WidgetStateView state={resolved} skeleton="list" emptyMessage={emptyMessage ?? t("No one here yet.", "لا يوجد أحد بعد.")} errorMessage={errorMessage} onRetry={onRetry} className={className} />;
  return (
    <ul aria-label={label} className={clsx("divide-y divide-hairline", className)}>
      {children}
    </ul>
  );
}
