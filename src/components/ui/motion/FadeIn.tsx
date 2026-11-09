import type { ElementType, ReactNode } from "react";

type FadeInProps = {
  children: ReactNode;
  /** The element to render; a `div` by default. */
  as?: ElementType;
  /** `up` rises 8px as it fades (content arriving); `in` only fades. */
  variant?: "up" | "in";
  className?: string;
};

/**
 * Content that fades in as it first appears: a card, a panel, a page's body,
 * a skeleton turning into the real thing. Plays once on mount, never on a
 * re-render or a data refresh; under reduced motion it is a 100ms fade.
 */
const FadeIn = ({ children, as: Tag = "div", variant = "up", className = "" }: FadeInProps) => (
  <Tag className={`${variant === "up" ? "animate-fade-up" : "animate-fade-in-base"} ${className}`}>{children}</Tag>
);

export { FadeIn };
export type { FadeInProps };
