import type { ReactNode } from "react";
import { SOLID_VARIANT_CLASSES, type BadgeTone } from "./variants";

type SolidBadgeProps = {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
};

/**
 * A filled badge: an unread count, an urgent marker. The spec's Badge metrics
 * (24px, oval); each fill carries the ink the contrast audit solved for it,
 * never a fixed white.
 */
const SolidBadge = ({ tone = "neutral", className = "", children }: SolidBadgeProps) => (
  <span
    className={`inline-flex h-badge min-w-7.5 shrink-0 items-center justify-center rounded-xl px-2 text-caption font-medium ${SOLID_VARIANT_CLASSES[tone]} ${className}`}
  >
    {children}
  </span>
);

export { SolidBadge };
export type { SolidBadgeProps };
