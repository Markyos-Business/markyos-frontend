"use client";
import { forwardRef, useLayoutEffect, useRef, useState } from "react";
import { IconButton } from "../button";
import { TabsList, type TabsListProps } from "./tabs-list";
import { useTabsFamily } from "./tabs-context";
export interface ScrollableTabsProps extends TabsListProps { previousLabel?: string; nextLabel?: string; }
export const ScrollableTabs = forwardRef<HTMLDivElement, ScrollableTabsProps>(function ScrollableTabs({ previousLabel = "Previous tabs", nextLabel = "Next tabs", className = "", children, ...props }, ref) {
  const family = useTabsFamily();
  const list = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  useLayoutEffect(() => {
    const element = list.current; if (!element) return;
    const measure = () => {
      const max = element.scrollWidth - element.clientWidth;
      const at = Math.abs(element.scrollLeft);
      setEdges({ start: at > 1, end: at < max - 1 });
    };
    const selected = element.querySelector<HTMLElement>('[aria-selected="true"]');
    if (selected) {
      const outer = element.getBoundingClientRect(); const inner = selected.getBoundingClientRect();
      const delta = inner.left < outer.left ? inner.left - outer.left : inner.right > outer.right ? inner.right - outer.right : 0;
      if (delta) element.scrollBy({ left: delta, behavior: "instant" });
    }
    measure();
    const observer = new ResizeObserver(measure); observer.observe(element);
    const mutation = new MutationObserver(measure); mutation.observe(element, { childList: true, subtree: true });
    element.addEventListener("scroll", measure);
    return () => { observer.disconnect(); mutation.disconnect(); element.removeEventListener("scroll", measure); };
  }, [family.value, family.tabs.length, family.dir]);
  function scroll(step: number) { const element = list.current; if (element) element.scrollBy({ left: step * element.clientWidth * (getComputedStyle(element).direction === "rtl" ? -1 : 1), behavior: "instant" }); }
  return <div className={`relative flex min-w-0 items-center ${className}`}>
    <IconButton size="sm" icon="angle-left" label={previousLabel} disabled={!edges.start} onClick={() => scroll(-1)} />
    <div className="relative min-w-0 flex-1">
      <TabsList {...props} ref={node => { list.current = node; if (typeof ref === "function") ref(node); else if (ref) ref.current = node; }}>{children}</TabsList>
      {edges.start && <span aria-hidden className="pointer-events-none absolute inset-y-0 start-0 w-5 bg-linear-to-r from-surface-1 to-transparent rtl:bg-linear-to-l" />}
      {edges.end && <span aria-hidden className="pointer-events-none absolute inset-y-0 end-0 w-5 bg-linear-to-l from-surface-1 to-transparent rtl:bg-linear-to-r" />}
    </div>
    <IconButton size="sm" icon="angle-right" label={nextLabel} disabled={!edges.end} onClick={() => scroll(1)} />
  </div>;
});
