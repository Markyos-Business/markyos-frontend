"use client";
import { forwardRef } from "react";
import { Icon } from "../icon";
import { Button, type ButtonProps, type ButtonVariant } from "./button";
/** The Button variants; ghost (the default) draws the glyph in the muted ink, as icons are at rest. */
export type IconButtonVariant = ButtonVariant;
export interface IconButtonProps extends Omit<ButtonProps, "children" | "icon" | "variant"> {
  icon: string;
  label: string;
  variant?: IconButtonVariant;
  iconSize?: 16 | 18 | 22;
  shape?: "square" | "round";
  /** With `href`: opens in a new tab (target _blank, rel noopener noreferrer), like LinkButton's `external`. */
  external?: boolean;
}
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ icon, label, variant = "ghost", iconSize = 18, size = "md", shape = "square", external, href, className = "", ...props }, ref) {
  const md = "w-ctl-md";
  const widths = { xs: "w-ctl-xs", sm: "w-ctl-sm", md, lg: "w-ctl-lg" };
  const look = `${widths[size]} !px-0 ${variant === "ghost" ? "text-text-muted" : ""} ${shape === "round" ? "!rounded-full" : ""} ${className}`;
  if (href && external) {
    return <Button {...props} ref={ref} size={size} variant={variant} asChild aria-label={label} title={props.title ?? label} icon={<Icon name={icon} size={iconSize} />} className={look}><a href={href} target="_blank" rel="noopener noreferrer" /></Button>;
  }
  return <Button {...props} ref={ref} href={href} size={size} variant={variant} aria-label={label} title={props.title ?? label} icon={<Icon name={icon} size={iconSize} />} className={look} />;
});
