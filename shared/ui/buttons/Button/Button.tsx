"use client";

import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "link";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40";

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px] gap-1.5",
  md: "h-11 px-5 text-[14px] gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
};

const variantClasses: Record<Exclude<Variant, "link">, string> = {
  // The solid pill is the opposite of the ground, not a fixed white: a
  // literal white vanished on the light theme.
  primary: "bg-solid text-solid-ink hover:opacity-90",
  // The outline is the hairline token for the same reason.
  secondary: "bg-surface-2 text-text ring-1 ring-inset ring-hairline hover:ring-hairline-strong",
  ghost: "bg-transparent text-text-muted hover:text-text",
};

// A text action: "Forgot?", "Log in", "Try another email". No pill and no
// size of its own, so it sits in a sentence; the caller sets the text size.
// The minimum height keeps it a comfortable tap target.
const linkClasses =
  "inline-flex items-center gap-1.5 min-h-[26px] text-accent-text cursor-pointer disabled:cursor-not-allowed disabled:opacity-40";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
}

interface ButtonProps extends CommonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  href?: undefined;
}

interface LinkProps extends CommonProps {
  href: string;
}

/** The app's button, as a `<button>` or, given `href`, a link. */
export function Button(props: ButtonProps | LinkProps) {
  const { variant = "secondary", size = "md", icon, className = "", children } = props;
  const cls =
    variant === "link"
      ? `${linkClasses} ${className}`
      : `${base} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={cls}>
        {icon}
        {children}
      </Link>
    );
  }

  const { href: _href, variant: _v, size: _s, icon: _i, className: _c, ...buttonProps } = props as ButtonProps;
  void [_href, _v, _s, _i, _c];
  return (
    <button {...buttonProps} className={cls}>
      {icon}
      {children}
    </button>
  );
}
