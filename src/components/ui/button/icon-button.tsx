"use client";
import { forwardRef } from "react";
import { Icon } from "../icon";
import { Button, type ButtonProps, type ButtonVariant } from "./button";
export type IconButtonVariant = ButtonVariant | "quiet";
export interface IconButtonProps extends Omit<ButtonProps, "children" | "icon" | "variant"> {
  icon: string;
  label: string;
  variant?: IconButtonVariant;
  iconSize?: 16 | 18 | 22;
  shape?: "square" | "round";
}
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ icon, label, variant = "quiet", iconSize = 18, size = "md", shape = "square", className = "", ...props }, ref) {
  const widths = { xs: "w-7", sm: "w-8", md: "w-9", lg: "w-10", icon: ["w-9"].join(" ") };
  return <Button {...props} ref={ref} size={size} variant={variant === "quiet" ? "link" : variant} aria-label={label} title={props.title ?? label} icon={<Icon name={icon} size={iconSize} />} className={`${widths[size]} !px-0 min-w-9 ${shape === "round" ? "!rounded-full" : ""} ${className}`} />;
});
