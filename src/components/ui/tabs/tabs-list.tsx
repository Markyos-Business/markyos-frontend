"use client";
import * as Primitive from "@radix-ui/react-tabs";
import { forwardRef, useLayoutEffect, useRef, useState } from "react";
import { useTabsFamily } from "./tabs-context";
export interface TabsListProps extends Primitive.TabsListProps { label?: string; }
export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsList({ label = "Sections", className = "", children, ...props }, ref) {
  const family = useTabsFamily();
  const row = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ start: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const list = row.current;
    if (!list) return;
    const place = () => {
      const selected = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (!selected) { setIndicator(null); return; }
      const item = selected.closest<HTMLElement>('[data-tab-item]') ?? selected;
      const rtl = getComputedStyle(list).direction === "rtl";
      const outer = list.getBoundingClientRect(); let inner = item.getBoundingClientRect();
      // Keep selection visible on resize as well as on activation. Scrolling
      // alone does not invoke this observer, so browsing with arrows is free.
      if (family.orientation === "horizontal" && list.clientWidth > 0) {
        const delta = inner.left < outer.left + 4 ? inner.left - outer.left - 4 : inner.right > outer.right - 4 ? inner.right - outer.right + 4 : 0;
        if (delta) { list.scrollBy({ left: delta, behavior: "instant" }); inner = item.getBoundingClientRect(); }
      }
      setIndicator({ start: (rtl ? outer.right - inner.right : inner.left - outer.left) + Math.abs(list.scrollLeft), width: inner.width });
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(list);
    list.querySelectorAll<HTMLElement>('[role="tab"]').forEach(item => observer.observe(item));
    const mutation = new MutationObserver(place);
    mutation.observe(list, { subtree: true, childList: true, characterData: true });
    document.fonts?.ready.then(place);
    return () => { observer.disconnect(); mutation.disconnect(); };
  }, [family.value, family.variant, family.tabs.length, family.dir, family.orientation]);
  const vertical = family.orientation === "vertical";
  const needsSelect = family.mobileAs === "select";
  return <div className={`min-w-0 ${vertical ? "shrink-0" : ""}`}>
    {needsSelect && <select aria-label={label} value={family.value} onChange={event => void family.request(event.target.value)} className="mk-tabs-mobile-select mb-2 min-h-10 w-full rounded-lg bg-surface-2 px-3 text-body text-text shadow-edge sm:hidden">{family.tabs.map(tab => <option key={tab.value} value={tab.value} disabled={tab.disabled}>{tab.label}</option>)}</select>}
    <Primitive.List {...props} ref={(node) => { row.current = node; if (typeof ref === "function") ref(node); else if (ref) ref.current = node; }} aria-label={label} data-tabs-variant={family.variant} className={`mk-tabs mk-family-tablist relative flex min-w-0 gap-1 p-1 ${vertical ? "flex-col items-stretch" : "items-stretch overflow-x-auto"} ${needsSelect ? "hidden sm:flex" : ""} ${family.fill ? "w-full" : ""} ${className}`}>
      {children}
      {family.variant === "underline" && indicator && <span aria-hidden="true" className="mk-tabs-underline pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-accent" style={{ insetInlineStart: indicator.start, width: indicator.width }} />}
    </Primitive.List>
  </div>;
});
