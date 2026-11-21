"use client";

import Link from "next/link";
import { Icon } from "../../icon";
import { useDashboardLocale } from "../shared/locale";
import { card, cardInteractive, focusRing } from "../shared/styles";

export interface QuickAction {
  icon?: string;
  label: string;
  href: string;
  description: string;
}
/** Keyboard accessible destinations for common role tasks. */
export default function QuickActions({
  actions,
  className = "",
}: {
  actions: QuickAction[];
  className?: string;
}) {
  const { t } = useDashboardLocale();
  return (
    <nav
      aria-label={t("Quick actions", "إجراءات سريعة")}
      className={`grid gap-3 sm:grid-cols-2 ${className}`}
    >
      {actions.map(({ icon, ...action }) => (
        <Link
          key={action.href}
          href={action.href}
          className={`${card} ${cardInteractive} ${focusRing} flex min-w-0 items-center gap-3 p-4`}
        >
          {icon && (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-widget bg-accent-soft text-accent-on-soft">
              <Icon name={icon} size={20} />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block text-body font-medium text-text">
              {action.label}
            </span>
            <span className="mt-1 block text-caption text-text-muted">
              {action.description}
            </span>
          </span>
          <Icon
            name="arrow-right"
            className="h-4 w-4 shrink-0 text-accent-text"
          />
        </Link>
      ))}
    </nav>
  );
}
