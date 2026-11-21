"use client";

import { useState, type KeyboardEvent } from "react";
import { usePhoneViewport } from "@/hooks/useNarrowViewport";
import { SOFT_VARIANT_CLASSES } from "../badge/variants";
import { ActionSheet } from "../overlay/action-sheet";
import { Popover } from "../overlay/popover";
import { Icon } from "../icon";
import { useUiStrings } from "../ui-strings";

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
  /** The trigger's control size, to match the buttons beside it. Default md. */
  size?: "sm" | "md";
  /** The phone action sheet's heading, e.g. "Nour Haddad actions". Defaults to `label`. */
  title?: string;
};

/** What opens the menu: the ⋯ square for a row, or a labelled outline button. */
const TriggerLook = ({ label, iconOnly, size = "md" }: { label: string; iconOnly: boolean; size?: "sm" | "md" }) =>
  iconOnly ? (
    <span className={`flex ${size === "sm" ? "size-ctl-sm" : "size-ctl-md"} items-center justify-center rounded-control text-text-muted hover:bg-ink-soft hover:text-text`}>
      <Icon name="ellipsis-h" size={18} />
    </span>
  ) : (
    // The outline button's look, at the control height of its size.
    <span className={`flex items-center gap-ctl-icon rounded-control bg-ink-soft font-medium text-text shadow-edge ${size === "sm" ? "h-ctl-sm px-ctl-px-sm text-caption" : "h-ctl-md px-ctl-px-md text-body"}`}>
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
/** Arrow keys, Home and End move between a menu's items, as a menu should; Tab still leaves it. */
function moveInMenu(e: KeyboardEvent<HTMLDivElement>) {
  const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
  if (!keys.includes(e.key)) return;
  const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')];
  if (!items.length) return;
  e.preventDefault();
  const at = items.indexOf(document.activeElement as HTMLButtonElement);
  const next =
    e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : e.key === "ArrowDown" ? (at + 1) % items.length : (at - 1 + items.length) % items.length;
  items[next].focus();
}

const ActionsDropdown = ({ items, label: labelProp, align = "end", iconOnly = false, size = "md", title }: ActionsDropdownProps) => {
  const { t } = useUiStrings();
  const label = labelProp ?? t.actions;
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
          <TriggerLook label={label} iconOnly={iconOnly} size={size} />
        </button>
        <ActionSheet open={sheetOpen} title={title ?? label} items={items} onClose={() => setSheetOpen(false)} />
      </>
    );
  }

  return (
    <Popover label={label} align={align} width={208} button={<TriggerLook label={label} iconOnly={iconOnly} size={size} />}>
      {(close) => (
        <div role="menu" aria-label={label} onKeyDown={moveInMenu} className="flex flex-col p-space-2">
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
