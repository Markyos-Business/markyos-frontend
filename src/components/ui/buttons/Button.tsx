"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "link";
type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40";

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-ui gap-1.5",
  md: "h-11 px-5 text-ui-md gap-2",
  lg: "h-12 px-6 text-ui-lg gap-2",
};

const variants: Record<Exclude<ButtonVariant, "link">, string> = {
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
const linkVariant =
  "inline-flex items-center gap-1.5 min-h-6.5 text-accent-text cursor-pointer disabled:cursor-not-allowed disabled:opacity-40";

type CommonProps = {
  variant?: ButtonVariant;
  /** Ignored by the `link` variant, which takes the size of the text around it. */
  size?: ButtonSize;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

type ButtonElementProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & { href?: undefined };

type ButtonLinkProps = CommonProps & { href: string };

type ButtonProps = ButtonElementProps | ButtonLinkProps;

/** The app's button, as a `<button>` or, given `href`, a link. */
const Button = (props: ButtonProps) => {
  const { variant = "secondary", size = "md", icon, className = "", children } = props;
  const cls =
    variant === "link" ? `${linkVariant} ${className}` : `${base} ${sizes[size]} ${variants[variant]} ${className}`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={cls}>
        {icon}
        {children}
      </Link>
    );
  }

  const { href: _href, variant: _v, size: _s, icon: _i, className: _c, ...buttonProps } = props as ButtonElementProps;
  void [_href, _v, _s, _i, _c];
  return (
    <button {...buttonProps} className={cls}>
      {icon}
      {children}
    </button>
  );
};

export { Button };
export type { ButtonProps, ButtonSize, ButtonVariant };
