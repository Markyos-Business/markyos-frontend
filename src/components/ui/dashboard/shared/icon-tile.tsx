"use client";

import { cx as clsx } from "../shared/styles";
import type { IconComponent } from "../types";

export type IconTileTone = "brand" | "success" | "warning" | "danger" | "neutral" | "onBrand";

export interface IconTileProps {
  icon: IconComponent;
  tone?: IconTileTone;
  /** sm 32 · md 40 (default) · lg 48. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const TONES: Record<IconTileTone, string> = {
  brand: "bg-accent-soft text-accent-on-soft",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-surface-2 text-text-muted",
  onBrand: "bg-solid text-solid-ink",
};
const SIZES = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" };
const ICON = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" };

/** Square tile (radius 8) holding a decorative icon in a tone. */
export default function IconTile({ icon: Icon, tone = "brand", size = "md", className }: IconTileProps) {
  return (
    <span aria-hidden="true" className={clsx("grid shrink-0 place-items-center rounded-widget", TONES[tone], SIZES[size], className)}>
      <Icon className={ICON[size]} />
    </span>
  );
}
