"use client";
import { forwardRef } from "react";
import { Button, type ButtonProps } from "./button";
export interface BadgeButtonProps extends ButtonProps { count?: number; unread?: boolean; unreadLabel?: string; }
export const BadgeButton = forwardRef<HTMLButtonElement, BadgeButtonProps>(function BadgeButton({ count, unread, unreadLabel = "Unread items", children = "View reviews", ...props }, ref) {
  return <Button {...props} ref={ref}>{children}{count !== undefined && <span className="ms-2 rounded-lg bg-ink-soft px-1.5 text-caption tabular-nums">{count}</span>}{unread && <><span aria-hidden="true" className="ms-2 size-2 rounded-full bg-accent-text" /><span className="sr-only">{unreadLabel}</span></>}</Button>;
});
