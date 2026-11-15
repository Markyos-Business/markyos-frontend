"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { Icon } from "../icon";
import { Tooltip } from "../tooltip";
export interface RouterTabItem { href: string; label: string; icon?: string; count?: number; disabled?: boolean; disabledReason?: string; }
export interface RouterTabsProps { items: readonly RouterTabItem[]; label?: string; className?: string; }
import { activeRoute } from "./tab-layout";
/** Choose the most specific match, so parent routes do not also announce current. */
export const RouterTabs = forwardRef<HTMLElement, RouterTabsProps>(function RouterTabs({ items, label = "Sections", className = "" }, ref) {
  const pathname = usePathname() ?? "";
  const active = items.filter(item => activeRoute(pathname, item.href)).sort((a, b) => b.href.split(/[?#]/, 1)[0].length - a.href.split(/[?#]/, 1)[0].length)[0]?.href;
  return <nav ref={ref} aria-label={label} className={`mk-router-tabs flex min-w-0 gap-1 overflow-x-auto p-1 ${className}`}>{items.map(item => {
    const link = <Link href={item.href} aria-current={active === item.href ? "page" : undefined} aria-disabled={item.disabled || !!item.disabledReason || undefined} onClick={event => { if (item.disabled || item.disabledReason) event.preventDefault(); }} className="mk-btn mk-family-tab inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-body font-medium text-text-muted">{item.icon && <Icon name={item.icon} size={16} />}{item.label}{item.count !== undefined && <span className="rounded-md bg-ink-soft px-1.5 text-caption">{item.count}</span>}</Link>;
    return item.disabledReason ? <Tooltip key={item.href} content={item.disabledReason}>{link}</Tooltip> : <span key={item.href}>{link}</span>;
  })}</nav>;
});
