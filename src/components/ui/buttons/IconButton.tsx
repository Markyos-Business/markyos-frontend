"use client";

import type { ButtonHTMLAttributes } from "react";
import { Icon } from "../primitives/Icon";

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  /** An icon name from the icon set. */
  icon: string;
  /** Said by screen readers and shown on hover: what pressing it does. */
  label: string;
  iconSize?: number;
};

/** A button that is only an icon, with its label for screen readers. */
const IconButton = ({ icon, label, iconSize = 15, className = "", type = "button", ...props }: IconButtonProps) => (
  <button
    {...props}
    type={type}
    aria-label={label}
    title={label}
    className={`inline-flex items-center justify-center min-w-6.5 min-h-6.5 rounded-lg cursor-pointer ${className}`}
  >
    <Icon name={icon} size={iconSize} />
  </button>
);

export { IconButton };
export type { IconButtonProps };
