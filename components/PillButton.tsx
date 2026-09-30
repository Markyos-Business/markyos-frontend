"use client";

import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px] gap-1.5",
  md: "h-11 px-5 text-[14px] gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
};

const variantClasses: Record<Variant, string> = {
  // The solid pill is the opposite of the ground, not a fixed white — see
  // --solid in globals.css. A literal white here vanished on the light theme.
  primary: "bg-[var(--solid)] text-[var(--solid-ink)] hover:opacity-90",
  // The outline is drawn from the hairline token for the same reason: a fixed
  // white-alpha ring is invisible on a light surface.
  secondary:
    "bg-surface-2 text-text shadow-[inset_0_0_0_1px_var(--hairline)] hover:shadow-[inset_0_0_0_1px_var(--hairline-strong)]",
  ghost: "bg-transparent text-text-muted hover:text-text",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
}

interface ButtonProps
  extends CommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  href?: undefined;
}

interface LinkProps extends CommonProps {
  href: string;
}

export function PillButton(props: ButtonProps | LinkProps) {
  const { variant = "secondary", size = "md", icon, className = "", children } = props;
  const cls = `inline-flex items-center justify-center rounded-full font-semibold transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={cls}>
        {icon}
        {children}
      </Link>
    );
  }

  const { href: _href, ...buttonProps } = props as ButtonProps;
  void _href;
  return (
    <button {...buttonProps} className={cls}>
      {icon}
      {children}
    </button>
  );
}
