"use client";

import { useLayoutEffect, useState } from "react";
import { Icon } from "../icon";
import { useTabNavigation } from "./use-tab-navigation";
import { tabButtonId, type TabOrientation } from "./tab-navigation";

type TabItem<T extends string = string> = { key: T; label: string; icon?: string; disabled?: boolean };

type TabsVariant = "text" | "icon" | "pill";

type TabsProps<T extends string> = {
  tabs: TabItem<T>[];
  active: T;
  onChange: (key: T) => void;
  /** The tab row's accessible name. */
  label: string;
  /**
   * The spec's two tab styles (§6.11), both 40px tall: `text` puts the active
   * tab on a raised pill with a hairline; `icon` makes it solid accent with an
   * overline label (LIST / GRID). `pill` is the compact filter row (Waiting /
   * Decided): 32px pills with an 8px radius, the active one on the accent tint.
   */
  variant?: TabsVariant;
  className?: string;
  id: string;
  /** ID of the changing content region, when this row controls a panel. */
  panelId: string;
  orientation?: TabOrientation;
};

/**
 * `indicator` is the pill that slides under the active tab (text and pill
 * styles); `on` is what the active tab itself keeps. The icon style keeps
 * its solid buttons and has no indicator.
 */
const looks: Record<TabsVariant, { base: string; on: string; off: string; indicator?: string }> = {
  text: {
    base: "h-control-sm rounded-lg px-space-5 text-body font-medium",
    on: "text-text",
    off: "text-text-muted hover:text-text",
    indicator: "rounded-lg bg-surface-2 shadow-edge",
  },
  icon: {
    base: "h-control-sm mk-btn rounded-lg px-space-5 text-overline uppercase",
    on: "bg-accent text-accent-ink",
    off: "bg-surface-2 text-text-muted",
  },
  pill: {
    base: "h-8 cursor-pointer rounded-lg px-3.5 text-[12px] font-semibold",
    on: "text-accent-on-soft",
    off: "bg-surface-1 text-text-muted",
    indicator: "rounded-full bg-accent-soft",
  },
};

/**
 * A row of tabs. The active pill slides to the tab chosen (transform, the
 * base duration) rather than jumping; it is placed without animation the
 * first time, so a page never opens with it gliding. The row scrolls sideways
 * when it outgrows its container.
 */
const Tabs = <T extends string>({ tabs, active, onChange, label, variant = "text", className = "", id, panelId, orientation = "horizontal" }: TabsProps<T>) => {
  const look = looks[variant];
  const groupId = id;
  const { row, tabProps } = useTabNavigation({ tabs, active, onChange, orientation });
  const [pill, setPill] = useState<{ x: number; y: number; width: number; height: number; moved: boolean } | null>(null);

  useLayoutEffect(() => {
    if (!look.indicator) return;
    const el = row.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!el) return;
    const place = () => setPill((prev) => ({ x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight, moved: prev !== null }));
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    return () => ro.disconnect();
  }, [active, look.indicator, tabs.length, orientation, row]);

  return (
    <div ref={row} id={groupId} role="tablist" aria-label={label} aria-orientation={orientation} data-tabs-variant={variant} className={`mk-tabs relative flex shrink-0 gap-space-3 ${orientation === "vertical" ? "flex-col items-stretch overflow-y-auto" : "items-center overflow-x-auto"} ${className}`}>
      {look.indicator && pill && (
        <span
          aria-hidden
          className={`pointer-events-none absolute start-0 top-0 ${look.indicator} ${pill.moved ? "transition-[translate,width,height] duration-base ease-standard" : ""}`}
          // Measured from the row's left edge, so a physical offset is right in both directions.
          style={{ left: 0, insetInlineStart: "auto", translate: `${pill.x}px ${pill.y}px`, width: pill.width, height: pill.height }}
        />
      )}
      {tabs.map(({ key, label: name, icon, disabled }) => (
        <button
          key={key}
          type="button"
          role="tab"
          id={tabButtonId(groupId, key)}
          aria-controls={panelId}
          aria-selected={active === key && !disabled}
          disabled={disabled}
          {...tabProps(key)}
          onClick={() => onChange(key)}
          className={`relative flex shrink-0 items-center gap-space-3 whitespace-nowrap transition-[background-color,color,box-shadow] disabled:cursor-not-allowed disabled:text-text-disabled ${look.base} ${
            active === key ? look.on : look.off
          } ${active === key && look.indicator && !pill ? look.indicator /* before the first measure */ : ""}`}
        >
          {icon && <Icon name={icon} size={16} />}
          {name}
        </button>
      ))}
    </div>
  );
};

export { Tabs };
export type { TabItem, TabsProps, TabsVariant };
