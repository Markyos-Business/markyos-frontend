import type { ElementType, ReactNode } from "react";

type SurfaceCardPadding = "none" | "sm" | "md" | "lg";

const paddings: Record<SurfaceCardPadding, string> = {
  none: "",
  sm: "p-space-6",
  md: "p-space-8",
  // Widget padding on small screens, view-card padding from `sm` (spec §2.4).
  lg: "p-space-8 sm:p-space-10",
};

type SurfaceCardProps = {
  /** The element it renders as: a `section` when it has its own heading. */
  as?: ElementType;
  padding?: SurfaceCardPadding;
  /** Layout only (flex, gap, grid placement); the card's look is fixed. */
  className?: string;
  children: ReactNode;
} & Record<string, unknown>;

/**
 * The spec's SurfaceCard (§6.1): the panel fill, the card radius and the
 * hairline drawn as an inset shadow (`mk-surface`), with no drop shadow.
 */
const SurfaceCard = ({ as: Tag = "div", padding = "lg", className = "", children, ...rest }: SurfaceCardProps) => (
  <Tag {...rest} className={`mk-surface rounded-card bg-surface-1 ${paddings[padding]} ${className}`.trim()}>
    {children}
  </Tag>
);

export { SurfaceCard };
export type { SurfaceCardPadding, SurfaceCardProps };
