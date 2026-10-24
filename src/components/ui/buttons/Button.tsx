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

// Hover and keyboard focus lift a filled button 1px onto a soft shadow; never
// a disabled one, and no movement for someone who has asked for less motion.
const lift =
  "not-disabled:hover:shadow-soft focus-visible:shadow-soft motion-safe:not-disabled:hover:-translate-y-px motion-safe:focus-visible:-translate-y-px";

const variants: Record<Exclude<ButtonVariant, "link">, string> = {
  // The solid pill is the opposite of the ground, not a fixed white: a
  // literal white vanished on the light theme.
  primary: `bg-solid text-solid-ink hover:opacity-90 ${lift}`,
  // The outline is the hairline token for the same reason.
  secondary: `bg-surface-2 text-text ring-1 ring-inset ring-hairline hover:ring-hairline-strong ${lift}`,
  // A text button: colour only. A shadow under something with no fill reads
  // as a smudge.
  ghost: "bg-transparent text-text-muted hover:text-text",
};

// A text action: "Forgot?", "Log in", "Try another email". No pill and no
// size of its own, so it sits in a sentence; the caller sets the text size.
// The minimum height keeps it a comfortable tap target. On hover and focus an
// underline grows from where the reading starts: the left in English, the
// right in Arabic.
const linkVariant =
  "relative inline-flex items-center gap-1.5 min-h-6.5 text-accent-text cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 " +
  "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-1 after:h-px after:origin-left rtl:after:origin-right after:scale-x-0 after:bg-current " +
  "after:transition-transform after:duration-base after:ease-out not-disabled:hover:after:scale-x-100 focus-visible:after:scale-x-100";

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
