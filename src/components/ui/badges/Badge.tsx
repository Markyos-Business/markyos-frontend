import type { ReactNode } from "react";
import { DOT_VARIANT_CLASSES, SOFT_VARIANT_CLASSES, type BadgeTone } from "./variants";

type BadgeSize = "sm" | "md";

const sizes: Record<BadgeSize, string> = {
  // The spec's Badge (§6.9): 24px, an oval 12px radius, beside a title or in
  // a table cell.
  sm: "h-badge min-w-7.5 gap-space-1 rounded-xl px-2 text-caption",
  // The spec's Tag (§6.7): 36px with an 8px radius.
  md: "h-tag gap-space-3 rounded-lg px-space-5 text-body",
};

type BadgeProps = {
  tone?: BadgeTone;
  size?: BadgeSize;
  /** An `<Icon>` before the label. */
  icon?: ReactNode;
  /**
   * Draw it as the spec's StatusTag (§6.8) instead: a 28px neutral pill with
   * muted text, where only the dot carries the tone.
   */
  dot?: boolean;
  className?: string;
  children: ReactNode;
};

/** A short status or count. */
const Badge = ({ tone = "neutral", size = "sm", icon, dot = false, className = "", children }: BadgeProps) =>
  dot ? (
    <span
      className={`inline-flex h-status-tag shrink-0 items-center gap-space-3 whitespace-nowrap rounded-md bg-surface-2 px-space-4 text-caption font-medium text-text-muted ${className}`}
    >
      <span aria-hidden className={`size-2 shrink-0 rounded-full ${DOT_VARIANT_CLASSES[tone]}`} />
      {icon}
      {children}
    </span>
  ) : (
    <span
      className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium ${sizes[size]} ${SOFT_VARIANT_CLASSES[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );

export { Badge };
export type { BadgeProps, BadgeSize };
