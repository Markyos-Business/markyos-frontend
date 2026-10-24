"use client";

import { SOFT_VARIANT_CLASSES } from "../badges/variants";
import { Popover } from "../overlays/Popover";
import { Icon } from "../primitives/Icon";

type ActionTone = "accent" | "info" | "success" | "warning" | "danger";

type ActionItem = {
  label: string;
  /** An icon name from the icon set. */
  icon: string;
  onSelect: () => void;
  /** Colours the item's icon tile; `danger` for anything destructive. */
  tone?: ActionTone;
};

type ActionsDropdownProps = {
  items: ActionItem[];
  /** The trigger's text and accessible name. */
  label?: string;
  align?: "start" | "end";
};

/**
 * A row's or a page's secondary actions behind one button. Built on Popover,
 * so it closes on a choice, an outside click and Escape, returns focus to the
 * trigger, and hangs off the same edge of it on either side of the page.
 */
const ActionsDropdown = ({ items, label = "Actions", align = "end" }: ActionsDropdownProps) => (
  <Popover
    label={label}
    align={align}
    width={208}
    button={
      // The outline button's look, at the compact control height.
      <span className="flex h-control-sm items-center gap-space-3 rounded-lg bg-ink-soft px-space-5 text-body font-medium text-text shadow-edge">
        {label}
        <Icon name="ellipsis-h" size={18} />
      </span>
    }
  >
    {(close) => (
      <div role="menu" aria-label={label} className="flex flex-col p-space-2">
        {items.map((item) => {
          return (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                item.onSelect();
              }}
              className="flex w-full items-center gap-space-4 rounded-lg px-space-3 py-space-2 text-start text-body"
            >
              <span className={`flex size-9.5 shrink-0 items-center justify-center rounded-lg ${SOFT_VARIANT_CLASSES[item.tone ?? "accent"]}`}>
                <Icon name={item.icon} size={18} />
              </span>
              <span className="font-medium text-text">{item.label}</span>
            </button>
          );
        })}
      </div>
    )}
  </Popover>
);

export { ActionsDropdown };
export type { ActionItem, ActionsDropdownProps, ActionTone };
