"use client";
import { forwardRef } from "react";
import type { AnchorHTMLAttributes } from "react";
import { Icon } from "../icon";
import { Button, type ButtonProps } from "./button";
export type LinkButtonProps = Omit<ButtonProps, keyof AnchorHTMLAttributes<HTMLAnchorElement> | "asChild" | "href"> & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; external?: boolean };
export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(function LinkButton({ href, external, target, rel, children = "View details", iconEnd, ...props }, ref) {
  return <Button {...(props as unknown as ButtonProps)} asChild iconEnd={iconEnd ?? (external ? <Icon name="external-link-alt" size={16} /> : undefined)}><a ref={ref} href={href} target={target ?? (external ? "_blank" : undefined)} rel={external || target === "_blank" ? `${rel ?? ""} noopener noreferrer`.trim() : rel}>{children}</a></Button>;
});
