"use client";

import Link from "next/link";
import { Slot } from "@radix-ui/react-slot";
import { cloneElement, forwardRef, isValidElement, useEffect } from "react";
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import { Icon } from "../icon";
import { Tooltip } from "../tooltip";
import { useUiStrings } from "../ui-strings";

/**
 * Four variants, one job each (review, 22 Nov 2026; docs/MARKYOS_COMPONENTS.md):
 * - primary: the one main action of an area, in the accent.
 * - secondary: every other action, a filled control with a hairline edge.
 * - ghost: quiet actions (toolbars, icon buttons, "Add…" inside a list),
 *   transparent until hovered.
 * - danger: destructive, after confirmation.
 * They replaced nine (outline, soft, solid, link, the accent tint and the
 * status tints), which gave about 24 looks across the app.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
/**
 * sm / md / lg share their heights with fields of the same size (32 / 40 /
 * 46px; sm and md are 44px on touch). xs (28px, 44px touch target) is for
 * dense in-row icon buttons only (IconButton); a labelled button is sm or up.
 */
export type ButtonSize = "xs" | "sm" | "md" | "lg";
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
  xs: "h-ctl-xs px-ctl-px-sm gap-ctl-icon text-caption",
  sm: "h-ctl-sm px-ctl-px-sm gap-ctl-icon text-caption",
  md: "h-ctl-md px-ctl-px-md gap-ctl-icon text-body",
  lg: "h-ctl-lg px-ctl-px-lg gap-ctl-icon text-body",
};
const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-ink",
  secondary: "bg-ink-soft text-text shadow-edge",
  ghost: "bg-transparent text-text",
  danger: "bg-danger-fill text-danger-ink",
};

/**
 * The button look for a control that has to be another element (a menu or
 * popover trigger renders its own <button>): the same family classes, so its
 * height, fill, hover, focus and disabled state match a Button of that
 * variant and size exactly.
 */
export function buttonLook(variant: ButtonVariant = "secondary", size: ButtonSize = "sm"): string {
  return `mk-btn mk-family-button relative inline-flex shrink-0 items-center justify-center rounded-control font-medium leading-none whitespace-nowrap cursor-pointer ${sizes[size]} ${variants[variant]}`;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = "secondary", size = "md", icon, iconEnd, active, block, href, asChild,
  loading, loadingText: loadingTextProp, successText: successTextProp, errorText: errorTextProp,
  status: statusProp, disabledReason, locked, lockedReason: lockedReasonProp, skeleton,
  disabled, children, className = "", type = "button", onClick, onClickCapture,
  "aria-label": ariaLabel, ...props
}, ref) {
  // In the interface's language unless the caller names them.
  const { t: ui } = useUiStrings();
  const loadingText = loadingTextProp ?? ui.saving;
  const successText = successTextProp ?? ui.buttonSaved;
  const errorText = errorTextProp ?? ui.buttonFailed;
  const lockedReason = lockedReasonProp ?? ui.buttonLocked;
  const status = statusProp ?? "idle";
  // Only a button that can show a state reserves room for its longest state
  // label, so the width doesn't jump when "Saving…" replaces "Save". One that
  // never does was being sized for "Try again" too: a 4-letter "Pick" at 99px.
  const showsStates = loading !== undefined || statusProp !== undefined;
  const busy = loading || status === "loading";
  const reason = locked ? lockedReason : disabledReason;
  const blocked = disabled || !!reason || busy || skeleton;
  const stateText = busy ? loadingText : status === "success" ? successText : status === "error" ? errorText : null;
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && !children && !ariaLabel) console.warn("Button: icon-only buttons require an aria-label.");
    if (process.env.NODE_ENV !== "production" && size === "xs" && children) console.warn("Button: xs is for icon-only buttons; a labelled button is sm or larger.");
  }, [children, ariaLabel, size]);
  const original = asChild && isValidElement(children) ? (children as ReactElement<{ children?: ReactNode }>).props.children : children;
  const content = <>
    <span className="inline-grid items-center gap-[inherit]">
    <span className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-[inherit] ${stateText ? "invisible" : ""}`} aria-hidden={!!stateText || undefined}>
      {locked ? <Icon name="lock" size={18} /> : icon}{original}{iconEnd}
    </span>
    {original && showsStates && [loadingText, successText, errorText].map((text, index) => <span key={index} aria-hidden="true" className="invisible col-start-1 row-start-1 inline-flex items-center justify-center gap-ctl-icon"><span className="w-[18px] shrink-0" />{text}</span>)}
    </span>
    {stateText && <span className="absolute inset-0 inline-flex items-center justify-center gap-ctl-icon">
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
    data-variant={variant}
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
