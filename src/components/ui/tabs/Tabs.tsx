"use client";

import { Icon } from "../primitives/Icon";

type TabItem<T extends string = string> = { key: T; label: string; icon?: string };

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
   * Decided): 32px rounded pills, the active one on the accent tint.
   */
  variant?: TabsVariant;
  className?: string;
};

const looks: Record<TabsVariant, { base: string; on: string; off: string }> = {
  text: {
    base: "h-control-sm rounded-lg px-space-5 text-body font-medium",
    on: "bg-surface-2 text-text shadow-edge",
    off: "text-text-muted hover:text-text",
  },
  icon: {
    base: "h-control-sm mk-btn rounded-lg px-space-5 text-overline uppercase",
    on: "bg-accent text-accent-ink",
    off: "bg-surface-2 text-text-muted",
  },
  pill: {
    base: "h-8 cursor-pointer rounded-full px-3.5 text-[12px] font-semibold",
    on: "bg-accent-soft text-accent-on-soft",
    off: "bg-surface-1 text-text-muted",
  },
};

/**
 * A row of tabs. Render the panel keyed by `active`; it swaps at once. The row
 * scrolls sideways when it outgrows its container.
 */
const Tabs = <T extends string>({ tabs, active, onChange, label, variant = "text", className = "" }: TabsProps<T>) => {
  const look = looks[variant];
  return (
    <div role="tablist" aria-label={label} className={`flex items-center gap-space-3 overflow-x-auto ${className}`}>
      {tabs.map(({ key, label: name, icon }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={active === key}
          onClick={() => onChange(key)}
          className={`flex shrink-0 items-center gap-space-3 whitespace-nowrap transition-[background-color,color,box-shadow] ${look.base} ${
            active === key ? look.on : look.off
          }`}
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
