"use client";
import { forwardRef } from "react";
import { Icon } from "../icon";
import { Button, type ButtonProps } from "./button";
import { ButtonGroup } from "./button-group";
import { MenuButton, type MenuButtonItem } from "./menu-button";
export interface SplitButtonProps extends ButtonProps { items: readonly MenuButtonItem[]; menuLabel?: string; groupLabel?: string; }
export const SplitButton = forwardRef<HTMLButtonElement, SplitButtonProps>(function SplitButton({ items, menuLabel = "Open options", groupLabel = "Action options", children = "Save", ...props }, ref) {
  return <ButtonGroup label={groupLabel} className={props.block ? "w-full" : ""}>
    <Button {...props} ref={ref}>{children}</Button>
    <MenuButton items={items} label={menuLabel} iconOnly icon={<Icon name="angle-down" size={16} />} variant={props.variant} size={props.size} disabled={props.disabled || props.loading || props.status === "loading"} disabledReason={props.disabledReason} locked={props.locked} lockedReason={props.lockedReason} skeleton={props.skeleton} />
  </ButtonGroup>;
});
