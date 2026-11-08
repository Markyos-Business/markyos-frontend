"use client";

import { useCallback, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { usePresence } from "@/hooks/usePresence";
import { Icon } from "../../ui/primitives/Icon";
import { DropdownPanel } from "./DropdownPanel";

type ListboxOption = { value: string; label: string; disabled?: boolean };

type OptionRowProps = {
  id: string;
  label: string;
  selected: boolean;
  active: boolean;
  disabled?: boolean;
  /** A checkbox mark for a multi-select; a tick for a single one. */
  multiple?: boolean;
  onHover: () => void;
  onPick: () => void;
};

/** One row of a dropdown list, shared by every dropdown in the kit. */
const OptionRow = ({ id, label, selected, active, disabled, multiple, onHover, onPick }: OptionRowProps) => (
  <li
    id={id}
    role="option"
    aria-selected={selected}
    aria-disabled={disabled || undefined}
    onMouseEnter={onHover}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onPick}
    className={`flex min-h-control-sm items-center gap-space-3 rounded-md px-space-4 py-space-2 text-body ${
      disabled ? "cursor-not-allowed text-text-disabled" : "cursor-pointer text-text"
    } ${active && !disabled ? "bg-surface-2" : ""}`}
  >
    {multiple ? (
      <span
        aria-hidden
        className={`flex size-5 shrink-0 items-center justify-center rounded-sm ${selected ? "bg-accent text-accent-ink" : "bg-surface-2 shadow-edge"}`}
      >
        {selected && <Icon name="check" size={16} />}
      </span>
    ) : (
      <Icon name="check" size={16} className={`shrink-0 text-accent-text ${selected ? "" : "invisible"}`} />
    )}
    <span className="min-w-0 flex-1 truncate">{label}</span>
  </li>
);

type ListboxProps = {
  id?: string;
  value: string;
  options: readonly ListboxOption[];
  onChange: (value: string) => void;
  /** Shown while the value matches no option. */
  placeholder?: string;
  /** The trigger's look: the underline field or the filter pill. */
  triggerClassName: string;
  /** Classes for the value text inside the trigger. */
  valueClassName?: string;
  /** Drawn before the value, e.g. a filter's icon. */
  leading?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  /** The panel width; the trigger's width by default. */
  panelWidth?: number;
  onBlur?: () => void;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
};

/**
 * A single-choice dropdown, drawn by the kit instead of the browser so it
 * looks the same on every page and platform (the native popup cannot be
 * styled). The trigger is a button; the list opens in `DropdownPanel`.
 *
 * Keyboard: Enter, Space or the arrows open it; the arrows, Home and End move;
 * typing a letter jumps to the next option that starts with it; Enter or Space
 * picks; Escape or Tab closes. Focus stays on the trigger the whole time and
 * the list follows it through `aria-activedescendant`.
 */
const Listbox = ({
  id,
  value,
  options,
  onChange,
  placeholder = "Select…",
  triggerClassName,
  valueClassName = "",
  leading,
  disabled = false,
  required,
  error = false,
  panelWidth,
  onBlur,
  ...aria
}: ListboxProps) => {
  const baseId = useId();
  const listId = `${baseId}-list`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const { mounted, closing } = usePresence(open);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const current = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const step = (from: number, dir: 1 | -1) => {
    for (let i = 1; i <= options.length; i++) {
      const next = (from + dir * i + options.length) % options.length;
      if (!options[next].disabled) return next;
    }
    return from;
  };

  const openList = () => {
    if (disabled) return;
    setActive(selectedIndex >= 0 ? selectedIndex : step(-1, 1));
    setOpen(true);
  };

  const close = useCallback(() => {
    setOpen(false);
    onBlur?.();
  }, [onBlur]);

  const pick = (i: number) => {
    const opt = options[i];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    close();
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => step(i, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => step(i, -1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(step(-1, 1));
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(step(options.length, -1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "Tab") {
      close();
    } else if (e.key.length === 1) {
      const ch = e.key.toLowerCase();
      for (let i = 1; i <= options.length; i++) {
        const n = (active + i) % options.length;
        if (!options[n].disabled && options[n].label.toLowerCase().startsWith(ch)) {
          setActive(n);
          break;
        }
      }
    }
  };

  return (
    <>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        // The select-only combobox pattern (ARIA 1.2): a button that owns a
        // listbox, with focus staying on it.
        role="combobox"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
        aria-required={required || undefined}
        aria-label={aria["aria-label"]}
        aria-labelledby={aria["aria-labelledby"]}
        aria-describedby={aria["aria-describedby"]}
        // A button can't carry aria-invalid; the note it points at says why,
        // and the field draws its danger underline from this.
        data-state={error ? "error" : undefined}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={`flex cursor-pointer items-center gap-space-3 text-start ${triggerClassName}`}
      >
        {leading}
        <span className={`min-w-0 flex-1 truncate ${current ? "" : "font-normal text-text-disabled"} ${valueClassName}`}>
          {current?.label ?? placeholder}
        </span>
        <Icon name={open ? "angle-up" : "angle-down"} size={16} className="shrink-0 text-text-muted" />
      </button>
      {mounted && (
        <DropdownPanel anchor={triggerRef} closing={closing} onOutside={close} width={panelWidth}>
          <ul id={listId} role="listbox" aria-label={aria["aria-label"]} aria-labelledby={aria["aria-labelledby"]} className="overflow-y-auto">
            {options.map((opt, i) => (
              <OptionRow
                key={`${opt.value}-${i}`}
                id={`${listId}-${i}`}
                label={opt.label}
                selected={i === selectedIndex}
                active={i === active}
                disabled={opt.disabled}
                onHover={() => setActive(i)}
                onPick={() => pick(i)}
              />
            ))}
          </ul>
        </DropdownPanel>
      )}
    </>
  );
};

export { Listbox, OptionRow };
export type { ListboxOption, ListboxProps };
