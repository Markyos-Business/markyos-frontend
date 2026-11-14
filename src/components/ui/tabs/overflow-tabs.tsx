"use client";
import { forwardRef, useLayoutEffect, useRef, useState } from "react";
import { MenuButton } from "../button";
import { TabsList } from "./tabs-list";
import { TabsTrigger } from "./tabs-trigger";
import { fitTabs } from "./tab-layout";
import { useTabsFamily, type TabData } from "./tabs-context";
export interface OverflowTabsProps { items: readonly TabData[]; label?: string; moreLabel?: string; className?: string; }
/** Measurements use a separate non-interactive row, so hidden tabs retain their true widths. */
export const OverflowTabs = forwardRef<HTMLDivElement, OverflowTabsProps>(function OverflowTabs({ items, label = "Sections", moreLabel = "More", className = "" }, ref) {
  const family = useTabsFamily();
  const wrapper = useRef<HTMLDivElement>(null);
  const measuring = useRef<HTMLDivElement>(null);
  const more = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<number[]>(items.map((_, index) => index));
  useLayoutEffect(() => {
    const element = wrapper.current;
    if (!element) return;
    const measure = () => {
      const widths = [...(measuring.current?.children ?? [])].map(child => (child as HTMLElement).offsetWidth);
      const available = element.clientWidth;
      const fit = fitTabs(widths, available, more.current?.offsetWidth ?? 90, items.findIndex(item => item.id === family.value));
      setVisible(previous => previous.join() === fit.join() ? previous : fit);
    };
    measure();
    const observer = new ResizeObserver(measure); observer.observe(element);
    if (measuring.current) observer.observe(measuring.current);
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [items, family.size, family.value, moreLabel]);
  const hidden = items.filter((_, index) => !visible.includes(index));
  // If the active tab moves into overflow, its labelled trigger stays in the
  // tablist. The menu remains navigation to the other overflowing sections.
  const displayed = items.filter((_, index) => visible.includes(index));
  return <div ref={node => { wrapper.current = node; if (typeof ref === "function") ref(node); else if (ref) ref.current = node; }} className={`relative flex min-w-0 items-start gap-1 ${className}`}>
    <div aria-hidden="true" ref={measuring} className={`pointer-events-none fixed start-0 top-0 invisible flex w-max whitespace-nowrap ${family.size === "sm" ? "text-caption" : "text-body"}`}>
      {items.map(item => <span key={item.id} className="inline-flex shrink-0 min-h-10 items-center gap-2 px-4 font-medium">{item.icon && <span className="w-4" />}{item.label}{(item.status || item.unread || item.unsaved) && <span className="w-1.5" />}{item.count !== undefined && <span className="px-1.5 text-caption">{item.count}</span>}</span>)}
    </div>
    <div className="min-w-0 flex-1"><TabsList label={label}>{displayed.map((item) => <TabsTrigger key={item.id} value={item.id} label={item.label} icon={item.icon} count={item.count} disabled={item.disabled} disabledReason={item.disabledReason} status={item.status} unread={item.unread} unsaved={item.unsaved} countLabel={item.countLabel} unreadLabel={item.unreadLabel} unsavedLabel={item.unsavedLabel} errorLabel={item.errorLabel} warningLabel={item.warningLabel} successLabel={item.successLabel} positionLabel={item.positionLabel} position={items.indexOf(item) + 1} total={items.length}>{item.label}</TabsTrigger>)}</TabsList></div>
    <div ref={more} className={hidden.length ? "shrink-0 p-1" : "pointer-events-none absolute invisible"}><MenuButton label={moreLabel} items={hidden.filter(item => item.id !== family.value).map(item => ({ id: item.id, label: item.label, icon: item.icon, disabled: item.disabled || !!item.disabledReason, onSelect: () => void family.request(item.id) }))} /></div>
  </div>;
});
