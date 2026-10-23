"use client";

import { ButtonHTMLAttributes } from "react";
import { Icon } from "../../primitives/Icon";

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** An icon name from the icon set. */
  icon: string;
  /** Said by screen readers and shown on hover: what pressing it does. */
  label: string;
  iconSize?: number;
}

/** A button that is only an icon, with its label for screen readers. */
export function IconButton({ icon, label, iconSize = 15, className = "", type = "button", ...props }: Props) {
  return (
    <button
      {...props}
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center min-w-[26px] min-h-[26px] rounded-[8px] cursor-pointer ${className}`}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
}
