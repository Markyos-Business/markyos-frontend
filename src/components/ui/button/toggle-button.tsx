"use client";
import { forwardRef, useState } from "react";
import { Button, type ButtonProps } from "./button";
export interface ToggleButtonProps extends Omit<ButtonProps, "onChange"> { pressed?: boolean; defaultPressed?: boolean; onPressedChange?: (pressed: boolean) => void; }
export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(function ToggleButton({ pressed, defaultPressed = false, onPressedChange, onClick, className = "", ...props }, ref) {
  const [local, setLocal] = useState(defaultPressed);
  const selected = pressed ?? local;
  return <Button {...props} ref={ref} active={selected} aria-pressed={selected} className={`aria-pressed:bg-accent-soft aria-pressed:text-accent-on-soft ${className}`} onClick={(event) => { onClick?.(event); if (event.defaultPrevented) return; setLocal(!selected); onPressedChange?.(!selected); }} />;
});
