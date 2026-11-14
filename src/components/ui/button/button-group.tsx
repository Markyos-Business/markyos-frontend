"use client";
import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> { label?: string; orientation?: "horizontal" | "vertical"; }
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup({ label = "Actions", orientation = "horizontal", className = "", children, onKeyDown, ...props }, ref) {
  return <div {...props} ref={ref} role="group" aria-label={label} onKeyDown={(event) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const keys = orientation === "vertical" ? ["ArrowUp", "ArrowDown"] : getComputedStyle(event.currentTarget).direction === "rtl" ? ["ArrowRight", "ArrowLeft"] : ["ArrowLeft", "ArrowRight"];
    if (![...keys, "Home", "End"].includes(event.key)) return;
    const buttons = [...event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), a[href]")].filter((item) => item.getAttribute("aria-disabled") !== "true");
    if (!buttons.length) return;
    event.preventDefault();
    const index = buttons.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === keys[0] ? -1 : 1) + buttons.length) % buttons.length;
    buttons[next]?.focus();
  }} data-orientation={orientation} className={`mk-button-group inline-flex ${orientation === "vertical" ? "flex-col items-stretch" : "items-stretch"} ${className}`}>{children}</div>;
});
