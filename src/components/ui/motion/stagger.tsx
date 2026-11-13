"use client";

import { useState, type ElementType, type ReactNode } from "react";
import { pageJustArrived } from "@/lib/motion";

type StaggerProps = {
  children: ReactNode;
  /** The container; keeps its own layout classes (a grid, a list). */
  as?: ElementType;
  className?: string;
};

/**
 * A group whose items arrive one after another: a stat row, a card grid, a
 * board's columns. Each direct child fades up 40ms after the one before, the
 * first six only. Mount-only; still when it mounts with a page that is already
 * transitioning in; a plain fade under reduced motion.
 */
const Stagger = ({ children, as: Tag = "div", className = "" }: StaggerProps) => {
  const [animate] = useState(() => !pageJustArrived());
  return <Tag className={`${animate ? "mk-stagger" : ""} ${className}`}>{children}</Tag>;
};

export { Stagger };
export type { StaggerProps };
