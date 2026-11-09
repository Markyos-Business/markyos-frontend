"use client";

import { useState, type ElementType, type ReactNode } from "react";
import { pageJustArrived } from "@/lib/motion";

type FadeInProps = {
  children: ReactNode;
  /** The element to render; a `div` by default. */
  as?: ElementType;
  /** `up` rises 8px as it fades (content arriving); `in` only fades (a skeleton turning into content). */
  variant?: "up" | "in";
  className?: string;
};

/**
 * Content that fades in as it first appears: a card, a panel, the real
 * content replacing its skeleton. Plays once on mount, never on a re-render or
 * a data refresh, and not at all when it mounts with a page that is already
 * transitioning in (the page's animation covers it). Under reduced motion it
 * is a 100ms fade.
 */
const FadeIn = ({ children, as: Tag = "div", variant = "up", className = "" }: FadeInProps) => {
  const [animate] = useState(() => !pageJustArrived());
  const motion = animate ? (variant === "up" ? "animate-fade-up" : "animate-fade-in-base") : "";
  return <Tag className={`${motion} ${className}`}>{children}</Tag>;
};

export { FadeIn };
export type { FadeInProps };
