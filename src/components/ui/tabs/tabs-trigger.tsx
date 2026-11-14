"use client";
import * as Primitive from "@radix-ui/react-tabs";
import { forwardRef, useEffect } from "react";
import { Icon } from "../icon";
import { Tooltip } from "../tooltip";
import { useTabsFamily, tabContentId, type TabStatus } from "./tabs-context";
import { tabButtonId } from "./tab-navigation";
export interface TabsTriggerProps extends Primitive.TabsTriggerProps {
  icon?: string; iconOnly?: boolean; label?: string; count?: number; unread?: boolean;
  status?: TabStatus; disabledReason?: string; closable?: boolean; onClose?: () => void;
  closeLabel?: string; unsaved?: boolean; loading?: boolean; skeleton?: boolean;
  countLabel?: string; unreadLabel?: string; unsavedLabel?: string;
  errorLabel?: string; warningLabel?: string; successLabel?: string;
  position?: number; total?: number; positionLabel?: (position: number, total: number) => string;
}
export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(function TabsTrigger({ value, icon, iconOnly, label, count, unread, status, disabled, disabledReason, closable, onClose, closeLabel = "Close tab", unsaved, loading, skeleton, countLabel = "items", unreadLabel = "Unread", unsavedLabel = "Unsaved changes", errorLabel = "Has errors", warningLabel = "Needs attention", successLabel = "Completed", position, total, positionLabel = (index, length) => `${index} of ${length}`, children, className = "", onKeyDown, onMouseDown, onFocus, ...props }, ref) {
  const family = useTabsFamily();
  const name = label ?? (typeof children === "string" ? children : value);
  const blocked = disabled || !!disabledReason || skeleton;
  const { register } = family;
  useEffect(() => register({ value, label: name, disabled: !!blocked }), [register, value, name, blocked]);
  const positionText = position !== undefined || family.tabs.length ? positionLabel(position ?? family.tabs.findIndex(tab => tab.value === value) + 1, total ?? family.tabs.length) : "";
  const statusName = status === "error" ? errorLabel : status === "warning" ? warningLabel : successLabel;
  const labelledName = iconOnly ? name : props["aria-label"];
  const accessibleName = labelledName ? [labelledName, count !== undefined ? `${count} ${countLabel}` : "", unread ? unreadLabel : "", unsaved ? unsavedLabel : "", status ? statusName : "", positionText].filter(Boolean).join(", ") : undefined;
  const trigger = <Primitive.Trigger {...props} ref={ref} value={value} id={props.id ?? tabButtonId(family.id, value)} aria-controls={props["aria-controls"] ?? tabContentId(family.id, value)} disabled={!!disabled && !disabledReason} aria-disabled={blocked || undefined} aria-selected={family.value === value && !blocked} aria-busy={loading || undefined}
    aria-label={accessibleName} data-skeleton={skeleton || undefined}
    onMouseDown={event => { onMouseDown?.(event); if (!blocked) family.refusedFocus.current = null; if (blocked) event.preventDefault(); }}
    onFocus={event => { onFocus?.(event);
      if (family.refusedFocus.current === value) {
        event.preventDefault(); family.refusedFocus.current = null;
        document.getElementById(tabButtonId(family.id, family.value))?.focus({ preventScroll: true });
      }
      if (blocked) event.preventDefault(); }}
    onKeyDown={event => { onKeyDown?.(event); if (event.defaultPrevented) return; family.refusedFocus.current = null; if (blocked && ["Enter", " "].includes(event.key)) event.preventDefault(); if (!blocked && event.key === "Delete" && closable) { event.preventDefault(); onClose?.(); } }}
    className={`mk-btn mk-family-tab relative flex min-h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 font-medium text-text-muted outline-none ${family.size === "sm" ? "text-caption" : family.size === "lg" ? "min-h-11 text-body px-5" : "min-h-10 text-body px-4"} ${family.fill ? "flex-1" : ""} ${family.variant === "icon" ? "bg-surface-2" : ""} ${className}`}>
    {icon && <Icon name={icon} size={16} />}{!iconOnly && (children ?? name)}
    {loading ? <span aria-hidden="true" className="h-4 w-5 rounded-sm bg-ink-soft" /> : count !== undefined && <span className="rounded-md bg-ink-soft px-1.5 text-caption" aria-label={`${count} ${countLabel}`}>{count}</span>}
    {unread && <span className="size-1.5 rounded-full bg-accent" role="img" aria-label={unreadLabel} />}
    {unsaved && <span className="size-1.5 rounded-full bg-warning" role="img" aria-label={unsavedLabel} />}
    {status && <span className={`size-1.5 rounded-full ${status === "error" ? "bg-danger" : status === "warning" ? "bg-warning" : "bg-success"}`} role="img" aria-label={statusName} />}
    {(position !== undefined || family.tabs.length > 0) && <span className="sr-only">{positionText}</span>}
  </Primitive.Trigger>;
  return <span data-tab-item={value} className={`relative inline-flex shrink-0 items-stretch ${family.fill ? "flex-1" : ""}`}>
    {disabledReason || iconOnly ? <Tooltip content={disabledReason ?? name} className={family.fill ? "w-full [&>button]:w-full" : ""}>{trigger}</Tooltip> : trigger}
    {closable && <button type="button" tabIndex={-1} aria-label={closeLabel} disabled={!!blocked} onClick={onClose} className="mk-btn mk-tabs-close inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-text-muted hover:text-text"><Icon name="times" size={16} /></button>}
  </span>;
});
