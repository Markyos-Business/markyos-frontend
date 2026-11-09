import type { ElementType, ReactNode } from "react";

type StaggerProps = {
  children: ReactNode;
  /** The container; keeps its own layout classes (a grid, a list). */
  as?: ElementType;
  className?: string;
};

/**
 * A group whose items arrive one after another: a stat row, a card grid, a
 * board's columns. Each direct child fades up 40ms after the one before, the
 * first six only. Mount-only, and off under reduced motion (a plain fade).
 */
const Stagger = ({ children, as: Tag = "div", className = "" }: StaggerProps) => <Tag className={`mk-stagger ${className}`}>{children}</Tag>;

export { Stagger };
export type { StaggerProps };
