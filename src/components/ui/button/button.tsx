"use client";

import Link from "next/link";
import { Slot } from "@radix-ui/react-slot";
import { cloneElement, forwardRef, isValidElement, useEffect } from "react";
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import { Icon } from "../icon";
import { Tooltip } from "../tooltip";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link" | "soft" | "success-soft" | "danger-soft" | "danger" | "light" | "solid";
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
const sizes: Record<ButtonSize, string> = {
  xs: "h-7 px-2.5 gap-1.5 text-caption",
  sm: "h-8 px-3 gap-1.5 text-caption",
  md: "h-9 px-4 gap-2 text-body",
  lg: "h-10 px-5 gap-2 text-body",
  icon: "size-9 p-0 text-body",
};
const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-ink",
  secondary: "bg-surface-2 text-text",
  outline: "bg-ink-soft text-text shadow-edge",
  ghost: "bg-accent-soft text-accent-on-soft",
  destructive: "bg-danger-fill text-danger-ink",
  link: "bg-transparent text-accent-text hover:underline underline-offset-2",
  soft: "bg-surface-2 text-text",
  "success-soft": "bg-success-soft text-success",
  "danger-soft": "bg-danger-soft text-danger",
  danger: "bg-danger-fill text-danger-ink",
  light: "bg-solid text-solid-ink",
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
    className={`mk-btn mk-family-button relative inline-flex shrink-0 items-center justify-center rounded-lg font-medium leading-none whitespace-nowrap ${sizes[size]} ${variants[variant]} ${active ? "is-active" : ""} ${block ? "w-full" : ""} ${blocked ? "cursor-not-allowed" : "cursor-pointer"} ${className}`}
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
