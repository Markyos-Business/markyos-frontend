"use client";

import type { ButtonHTMLAttributes } from "react";
import { Icon } from "../primitives/Icon";

type IconButtonVariant = "quiet" | "primary" | "outline";

// `quiet` is a bare glyph with a comfortable hit area (a close button, a row
// action). `primary` and `outline` are the spec's ArrowButton (§6.3): a 46px
// square with an 8px radius, for next/prev, add and toolbar actions.
const variants: Record<IconButtonVariant, string> = {
  quiet: "min-w-6.5 min-h-6.5 rounded-lg disabled:cursor-not-allowed disabled:opacity-40",
  primary: "mk-btn size-control rounded-lg bg-accent text-accent-ink disabled:bg-surface-2 disabled:text-text-disabled",
  outline: "mk-btn size-control rounded-lg bg-ink-soft text-text shadow-edge disabled:bg-surface-2 disabled:text-text-disabled disabled:shadow-none",
};

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  /** An icon name from the icon set. */
  icon: string;
  /** Said by screen readers and shown on hover: what pressing it does. */
  label: string;
  variant?: IconButtonVariant;
  /** 16, 18 or 22 (spec §4). Defaults to 16 for `quiet`, 18 otherwise. */
  iconSize?: 16 | 18 | 22;
};

/** A button that is only an icon, with its label for screen readers. */
const IconButton = ({ icon, label, variant = "quiet", iconSize, className = "", type = "button", ...props }: IconButtonProps) => (
  <button
    {...props}
    type={type}
    aria-label={label}
    title={label}
    className={`inline-flex items-center justify-center transition-colors ${variants[variant]} ${className}`}
  >
    <Icon name={icon} size={iconSize ?? (variant === "quiet" ? 16 : 18)} />
  </button>
);

export { IconButton };
export type { IconButtonProps, IconButtonVariant };
