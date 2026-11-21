"use client";

import Link from "next/link";
import { Slot } from "@radix-ui/react-slot";
import { cloneElement, forwardRef, isValidElement, useEffect } from "react";
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import { Icon } from "../icon";
import { Tooltip } from "../tooltip";

/**
 * One variant per job. Primary: the page's main action. Outline: secondary
 * actions. Link and soft: tertiary. Danger: destructive, after confirmation.
 * Ghost (accent tint), the soft status tints and solid cover the rest.
 * `secondary`, `destructive` and `light` were duplicates of soft, danger and
 * solid and are gone.
 */
export type ButtonVariant = "primary" | "outline" | "ghost" | "link" | "soft" | "success-soft" | "danger-soft" | "danger" | "solid";
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon";
export type ButtonStatus = "idle" | "loading" | "success" | "error";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconEnd?: ReactNode;
  active?: boolean;
  block?: boolean;
  href?: string;
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  status?: ButtonStatus;
  disabledReason?: string;
  locked?: boolean;
  lockedReason?: string;
  skeleton?: boolean;
  /** Gallery-only state simulation; never changes interaction semantics. */
  "data-state"?: string;
}
/**
 * Heights and side padding are the form-control tokens (MARKYOS_UI §2.6), so
 * a button sits level with the field or select of its size. `xs` is the dense
 * in-row size (28px, with a 44px touch target); sm and md are 44px on touch.
 */
const sizes: Record<ButtonSize, string> = {
  xs: "h-ctl-xs px-ctl-px-sm gap-1.5 text-caption",
  sm: "h-ctl-sm px-ctl-px-sm gap-1.5 text-caption",
  md: "h-ctl-md px-ctl-px-md gap-2 text-body",
  lg: "h-ctl-lg px-ctl-px-lg gap-2 text-body",
  icon: "size-ctl-md p-0 text-body",
};
const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-ink",
  outline: "bg-ink-soft text-text shadow-edge",
  ghost: "bg-accent-soft text-accent-on-soft",
  link: "bg-transparent text-accent-text hover:underline underline-offset-2",
  soft: "bg-surface-2 text-text",
  "success-soft": "bg-success-soft text-success",
  "danger-soft": "bg-danger-soft text-danger",
  danger: "bg-danger-fill text-danger-ink",
  solid: "bg-solid text-solid-ink",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = "outline", size = "md", icon, iconEnd, active, block, href, asChild,
  loading, loadingText = "Saving", successText = "Saved", errorText = "Try again",
  status = "idle", disabledReason, locked, lockedReason = "Ask for access", skeleton,
  disabled, children, className = "", type = "button", onClick, onClickCapture,
  "aria-label": ariaLabel, ...props
}, ref) {
  const busy = loading || status === "loading";
  const reason = locked ? lockedReason : disabledReason;
  const blocked = disabled || !!reason || busy || skeleton;
  const stateText = busy ? loadingText : status === "success" ? successText : status === "error" ? errorText : null;
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && !children && !ariaLabel) console.warn("Button: icon-only buttons require an aria-label.");
  }, [children, ariaLabel]);
  const original = asChild && isValidElement(children) ? (children as ReactElement<{ children?: ReactNode }>).props.children : children;
  const content = <>
    <span className="inline-grid items-center gap-[inherit]">
    <span className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-[inherit] ${stateText ? "invisible" : ""}`} aria-hidden={!!stateText || undefined}>
      {locked ? <Icon name="lock" size={18} /> : icon}{original}{iconEnd}
    </span>
    {original && [loadingText, successText, errorText].map((text, index) => <span key={index} aria-hidden="true" className="invisible col-start-1 row-start-1 inline-flex items-center justify-center gap-2"><span className="w-[18px] shrink-0" />{text}</span>)}
    </span>
    {stateText && <span className="absolute inset-0 inline-flex items-center justify-center gap-2">
      <Icon name={busy ? "clock" : status === "success" ? "check" : "exclamation-circle"} size={18} />{original && stateText}
    </span>}
    <span className="sr-only" role="status" aria-live="polite">{stateText}</span>
  </>;
  const slotted = href ? <Link href={href}>{content}</Link> : asChild && isValidElement(children) ? cloneElement(children as ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>, blocked ? { onClick: undefined, onClickCapture: undefined } : {}, content) : content;
  const Component = href || asChild ? Slot : "button";
  const control = <Component
    {...props} ref={ref} type={href || asChild ? undefined : type}
    disabled={href || asChild ? undefined : !!disabled && !reason}
    aria-disabled={blocked || undefined} aria-busy={busy || undefined}
    aria-label={ariaLabel ? stateText ? `${ariaLabel}: ${stateText}` : ariaLabel : undefined}
    data-status={busy ? "loading" : status} data-skeleton={skeleton || undefined}
    data-active={active || undefined}
    data-size={size}
    className={`mk-btn mk-family-button relative inline-flex shrink-0 items-center justify-center rounded-control font-medium leading-none whitespace-nowrap ${sizes[size]} ${variants[variant]} ${active ? "is-active" : ""} ${block ? "w-full" : ""} ${blocked ? "cursor-not-allowed" : "cursor-pointer"} ${className}`}
    onClickCapture={(event) => {
      if (blocked) { event.preventDefault(); event.stopPropagation(); return; }
      onClickCapture?.(event as React.MouseEvent<HTMLButtonElement>);
    }}
    onClick={(event) => {
      if (blocked) { event.preventDefault(); event.stopPropagation(); return; }
      onClick?.(event as React.MouseEvent<HTMLButtonElement>);
    }}
  >{slotted}</Component>;
  return reason ? <Tooltip content={reason} className={block ? "w-full" : ""}>{control}</Tooltip> : control;
});
