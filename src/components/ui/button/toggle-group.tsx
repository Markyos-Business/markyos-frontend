"use client";
import { forwardRef, useState } from "react";
import type { HTMLAttributes } from "react";
import { Icon } from "../icon";
import type { ButtonSize, ButtonVariant } from "./button";
import { ToggleButton } from "./toggle-button";
import { ButtonGroup } from "./button-group";
export interface ToggleGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  label?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  type?: "single" | "multiple";
  options: readonly { value: string; label: string; icon?: string; disabled?: boolean }[];
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  orientation?: "horizontal" | "vertical";
}
export const ToggleGroup = forwardRef<HTMLDivElement, ToggleGroupProps>(function ToggleGroup({ label = "Choose view", type = "single", options, value, defaultValue, onValueChange, orientation = "horizontal", size = "sm", variant = "outline", onKeyDown, className = "", ...props }, ref) {
  const [local, setLocal] = useState<string | string[]>(defaultValue ?? (type === "single" ? "" : []));
  const [focused, setFocused] = useState<string | null>(null);
  const selection = value ?? local;
  const selected = Array.isArray(selection) ? selection : [selection];
  const enabled = options.filter((option) => !option.disabled);
  const tabValue = enabled.some((option) => option.value === focused) ? focused : enabled.find((option) => selected.includes(option.value))?.value ?? enabled[0]?.value;
  return <ButtonGroup {...props} ref={ref} label={label} orientation={orientation} className={`max-w-full overflow-x-auto p-1 ${className}`} onKeyDown={(event) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const keys = orientation === "vertical" ? ["ArrowUp", "ArrowDown"] : getComputedStyle(event.currentTarget).direction === "rtl" ? ["ArrowRight", "ArrowLeft"] : ["ArrowLeft", "ArrowRight"];
    if (![...keys, "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === keys[0] ? -1 : 1) + buttons.length) % buttons.length;
    buttons[next]?.focus();
  }}>
    {options.map((option) => <ToggleButton key={option.value} size={size} variant={variant} disabled={option.disabled} pressed={selected.includes(option.value)} tabIndex={option.value === tabValue ? 0 : -1} onFocus={() => setFocused(option.value)} icon={option.icon ? <Icon name={option.icon} size={18} /> : undefined} onPressedChange={(pressed) => {
      const next = type === "single" ? pressed ? option.value : "" : pressed ? [...selected, option.value] : selected.filter((item) => item !== option.value);
      setLocal(next); onValueChange?.(next);
    }}>{option.label}</ToggleButton>)}
  </ButtonGroup>;
});
