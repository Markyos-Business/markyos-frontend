"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "ghost" | "soft" | "danger" | "light" | "solid" | "link";
type ButtonSize = "xs" | "sm" | "md";

// Spec §6.2: 46px, an 8px radius and a 14px label at weight 500, with the
// icon before it. Hover and press are the shared `mk-btn` scrim over the
// resting fill (tailwind/base.js): no lift, no scale, no darker colour.
const base =
  "mk-btn inline-flex items-center justify-center leading-none font-medium whitespace-nowrap transition-colors " +
  "disabled:bg-surface-2 disabled:text-text-disabled disabled:shadow-none aria-disabled:bg-surface-2 aria-disabled:text-text-disabled aria-disabled:shadow-none";

// Radius and type size live with the size, so a size never fights the base.
const sizes: Record<ButtonSize, string> = {
  // A pill for top bars, toolbars and row actions: 32px, fully round, a 12px
  // label. Smaller than the spec's controls, kept for the dense chrome built
  // before it.
  xs: "h-8 rounded-full px-3.5 gap-1.5 text-[12px]",
  // The compact step, for dense toolbars: the spec's 40px control height.
  sm: "h-control-sm rounded-lg text-body px-space-6 gap-space-3",
  md: "h-control rounded-lg text-body px-space-8 gap-space-4",
};

const variants: Record<Exclude<ButtonVariant, "link">, string> = {
  primary: "bg-accent text-accent-ink",
  outline: "bg-ink-soft text-text shadow-edge",
  ghost: "bg-accent-soft text-accent-on-soft",
  // The raised neutral fill (spec §2.3): a quiet action that still reads as a button.
  soft: "bg-surface-2 text-text",
  // Confirms something destructive: the spec's red, with the ink solved for it.
  danger: "bg-danger-fill text-danger-ink",
  // White on black whichever theme is on: marketing calls to action only.
  light: "bg-white text-black",
  // The theme's own ink as the fill: black on light, white on dark. For a
  // card's single action where the accent would compete with its content.
  solid: "bg-solid text-solid-ink",
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
