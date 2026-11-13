"use client";

import { useState } from "react";
import { usePhoneViewport } from "@/hooks/useNarrowViewport";
import { SOFT_VARIANT_CLASSES } from "../badges/variants";
import { ActionSheet } from "../overlays/ActionSheet";
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
  /** Shown but not choosable; `reason` says why, as its tooltip. */
  disabled?: boolean;
  reason?: string;
};

type ActionsDropdownProps = {
  items: ActionItem[];
  /** The trigger's text and accessible name. */
  label?: string;
  align?: "start" | "end";
  /** Just the ⋯ glyph, square, with `label` as its accessible name: a table row's menu. Default false. */
  iconOnly?: boolean;
  /** The phone action sheet's heading, e.g. "Nour Haddad actions". Defaults to `label`. */
  title?: string;
};

/** What opens the menu: the ⋯ square for a row, or a labelled outline button. */
const TriggerLook = ({ label, iconOnly }: { label: string; iconOnly: boolean }) =>
  iconOnly ? (
    <span className="flex size-control-sm items-center justify-center rounded-lg text-text-muted hover:bg-ink-soft hover:text-text">
      <Icon name="ellipsis-h" size={18} />
    </span>
  ) : (
    // The outline button's look, at the compact control height.
    <span className="flex h-control-sm items-center gap-space-3 rounded-lg bg-ink-soft px-space-5 text-body font-medium text-text shadow-edge">
      {label}
      <Icon name="ellipsis-h" size={18} />
    </span>
  );

/**
 * A row's or a page's secondary actions behind one button.
 *
 * On a phone it opens an action sheet from the bottom (`ActionSheet`); wider,
 * a dropdown built on Popover, which closes on a choice, an outside click and
 * Escape, returns focus to the trigger, and hangs off the same edge of it on
 * either side of the page.
 */
const ActionsDropdown = ({ items, label = "Actions", align = "end", iconOnly = false, title }: ActionsDropdownProps) => {
  const phone = usePhoneViewport();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (phone) {
    return (
      <>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={sheetOpen}
          aria-label={label}
          title={label}
          onClick={() => setSheetOpen(true)}
          className="flex cursor-pointer items-center"
        >
          <TriggerLook label={label} iconOnly={iconOnly} />
        </button>
        <ActionSheet open={sheetOpen} title={title ?? label} items={items} onClose={() => setSheetOpen(false)} />
      </>
    );
  }

  return (
    <Popover label={label} align={align} width={208} button={<TriggerLook label={label} iconOnly={iconOnly} />}>
      {(close) => (
        <div role="menu" aria-label={label} className="flex flex-col p-space-2">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              aria-disabled={item.disabled}
              title={item.disabled ? item.reason : undefined}
              onClick={() => {
                close();
                item.onSelect();
              }}
              className="flex w-full items-center gap-space-4 rounded-lg px-space-3 py-space-2 text-start text-body disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className={`flex size-9.5 shrink-0 items-center justify-center rounded-lg ${SOFT_VARIANT_CLASSES[item.tone ?? "accent"]}`}>
                <Icon name={item.icon} size={18} />
              </span>
              <span className={`font-medium ${item.tone === "danger" ? "text-danger" : "text-text"}`}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
};

export { ActionsDropdown };
export type { ActionItem, ActionsDropdownProps, ActionTone };
