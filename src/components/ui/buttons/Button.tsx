"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger" | "light" | "link";
type ButtonSize = "sm" | "md";

// Spec §6.2: 46px, an 8px radius and a 14px label at weight 500, with the
// icon before it. Hover and press are the shared `mk-btn` scrim over the
// resting fill (tailwind/base.js): no lift, no scale, no darker colour.
const base =
  "mk-btn inline-flex items-center justify-center rounded-lg text-body leading-none font-medium whitespace-nowrap transition-colors " +
  "disabled:bg-surface-2 disabled:text-text-disabled disabled:shadow-none aria-disabled:bg-surface-2 aria-disabled:text-text-disabled aria-disabled:shadow-none";

const sizes: Record<ButtonSize, string> = {
  // The compact step, for dense toolbars: the spec's 40px control height.
  sm: "h-control-sm px-space-6 gap-space-3",
  md: "h-control px-space-8 gap-space-4",
};

const variants: Record<Exclude<ButtonVariant, "link">, string> = {
  primary: "bg-accent text-accent-ink",
  outline: "bg-ink-soft text-text shadow-edge",
  ghost: "bg-accent-soft text-accent-on-soft",
  // Confirms something destructive: the spec's red, with the ink solved for it.
  danger: "bg-danger-fill text-danger-ink",
  // White on black whichever theme is on: marketing calls to action only.
  light: "bg-white text-black",
};

// A text action: "Forgot?", "Log in", "Try another email". No fill and no
// size of its own, so it sits in a sentence; the caller sets the text size.
// The minimum height keeps it a comfortable tap target.
const linkVariant =
  "inline-flex items-center gap-1.5 min-h-6.5 text-accent-text underline-offset-2 transition-colors " +
  "not-disabled:hover:underline focus-visible:underline disabled:text-text-disabled";

type CommonProps = {
  variant?: ButtonVariant;
  /** Ignored by the `link` variant, which takes the size of the text around it. */
  size?: ButtonSize;
  /** An icon node, drawn before the label; use an 18px `Icon`. */
  icon?: ReactNode;
  /** Keep the hover scrim on: the button stands for the current choice. */
  active?: boolean;
  /** Fill the width of the container. */
  block?: boolean;
  className?: string;
  children?: ReactNode;
};

type ButtonElementProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & { href?: undefined };

type ButtonLinkProps = CommonProps & { href: string };

type ButtonProps = ButtonElementProps | ButtonLinkProps;

/** The app's button, as a `<button>` or, given `href`, a link. */
const Button = (props: ButtonProps) => {
  const { variant = "outline", size = "md", icon, active, block, className = "", children } = props;
  const cls =
    variant === "link"
      ? `${linkVariant} ${className}`
      : `${base} ${sizes[size]} ${variants[variant]} ${active ? "is-active" : ""} ${block ? "w-full" : ""} ${className}`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={cls}>
        {icon}
        {children}
      </Link>
    );
  }

  const {
    href: _href,
    variant: _v,
    size: _s,
    icon: _i,
    active: _a,
    block: _b,
    className: _c,
    ...buttonProps
  } = props as ButtonElementProps;
  void [_href, _v, _s, _i, _a, _b, _c];
  return (
    <button {...buttonProps} className={cls}>
      {icon}
      {children}
    </button>
  );
};

export { Button };
export type { ButtonProps, ButtonSize, ButtonVariant };
