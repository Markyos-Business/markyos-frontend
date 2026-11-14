"use client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { forwardRef, useState } from "react";
import { Icon } from "../icon";
import { Button, type ButtonProps } from "./button";
export type MenuButtonItem = { id?: string; label: string; icon?: string; shortcut?: string; destructive?: boolean; disabled?: boolean; onSelect?: () => void; separator?: boolean } | { separator: true; id?: string; label?: never };
export interface MenuButtonProps extends Omit<ButtonProps, "children"> {
  label?: string;
  items: readonly MenuButtonItem[];
  iconOnly?: boolean;
  align?: "start" | "end";
  dir?: "ltr" | "rtl";
}
export const MenuButton = forwardRef<HTMLButtonElement, MenuButtonProps>(function MenuButton({ label = "Open menu", items, iconOnly, align = "end", dir, icon, ...props }, ref) {
  const [open, setOpen] = useState(false);
  const [inheritedDir, setInheritedDir] = useState<"ltr" | "rtl">("ltr");
  return <DropdownMenu.Root open={open} onOpenChange={setOpen} dir={dir ?? inheritedDir}>
    <DropdownMenu.Trigger asChild disabled={!!(props.disabled || props.disabledReason || props.locked || props.loading || props.status === "loading" || props.skeleton)}>
      <Button {...props} ref={ref} aria-label={iconOnly ? label : props["aria-label"]} aria-haspopup="menu" aria-expanded={open}
        onFocus={(event) => { setInheritedDir(getComputedStyle(event.currentTarget).direction === "rtl" ? "rtl" : "ltr"); props.onFocus?.(event); }}
        onPointerDown={(event) => { setInheritedDir(getComputedStyle(event.currentTarget).direction === "rtl" ? "rtl" : "ltr"); props.onPointerDown?.(event); }}
        icon={icon ?? (iconOnly ? <Icon name="ellipsis-v" size={18} /> : undefined)}
        iconEnd={iconOnly ? undefined : <Icon name="angle-down" size={16} />} className={`${iconOnly ? "min-w-9 !px-2" : ""} ${props.className ?? ""}`}>
        {iconOnly ? undefined : label}
      </Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal><DropdownMenu.Content align={align} sideOffset={4} className="z-modal min-w-48 max-w-[calc(100vw-2rem)] rounded-lg bg-surface-2 p-1 text-text shadow-pop" aria-label={label}>
      {items.map((item, index) => item.separator ? <DropdownMenu.Separator key={item.id ?? index} className="my-1 h-px bg-border" /> : <DropdownMenu.Item key={item.id ?? index} disabled={item.disabled} onSelect={item.onSelect} className={`flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-body outline-none data-[highlighted]:bg-ink-soft data-[disabled]:text-text-muted data-[disabled]:cursor-not-allowed ${item.destructive ? "text-danger" : ""}`}>
        {item.icon && <Icon name={item.icon} size={18} />}<span>{item.label}</span>{item.shortcut && <span className="ms-auto ps-4 text-caption text-text-muted">{item.shortcut}</span>}
      </DropdownMenu.Item>)}
    </DropdownMenu.Content></DropdownMenu.Portal>
  </DropdownMenu.Root>;
});
