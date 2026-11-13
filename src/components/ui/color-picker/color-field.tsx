"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { DropdownPanel } from "../listbox/dropdown-panel";
import { FieldLabel, FieldNote, fieldBlockClasses, fieldClasses, type FieldSize } from "../field/input-field";
import { useUiStrings } from "../ui-strings";
import { useRecentColours } from "./use-recent-colours";
import { ColorPicker, type ColorSwatch } from "./color-picker";
import { normalizeHex } from "@/lib/color";
import { usePresence } from "@/hooks/usePresence";

type ColorPopoverProps = {
  value: string;
  onChange: (hex: string) => void;
  swatches?: ColorSwatch[];
  /** The trigger's accessible name, e.g. "Card colour". */
  label: string;
  /** What the trigger shows: a swatch, an icon. */
  children: ReactNode;
  triggerClassName?: string;
  triggerStyle?: CSSProperties;
  title?: string;
  /** For a `<label htmlFor>` outside. */
  id?: string;
};

/**
 * Any control that opens the colour picker: a swatch, an eyedropper icon on a
 * card. The picker floats beside it (the kit's dropdown panel, so a drawer or
 * a canvas never clips it); Escape or a press outside closes it and focus
 * goes back to the trigger.
 *
 * Presses and keys inside stop here, so a canvas behind it does not start a
 * drag or move its selection while a colour is being picked.
 */
const ColorPopover = ({ value, onChange, swatches, label, children, triggerClassName = "", triggerStyle, title, id }: ColorPopoverProps) => {
  const [open, setOpen] = useState(false);
  const { mounted, closing } = usePresence(open);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const { recent, remember } = useRecentColours();
  // The colour it closes on is the one chosen; dragging through others doesn't count.
  const close = useCallback(() => {
    setOpen(false);
    remember(value);
  }, [remember, value]);

  // Escape closes it wherever focus is (the panel handles its own, below), and
  // opening moves focus into the panel: it renders in a portal Tab can't reach.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      close();
      trigger.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    const frame = requestAnimationFrame(() => document.getElementById(panelId)?.focus({ preventScroll: true }));
    return () => {
      document.removeEventListener("keydown", onKey);
      cancelAnimationFrame(frame);
    };
  }, [open, close, panelId]);

  return (
    <>
      <button
        ref={trigger}
        id={id}
        type="button"
        aria-label={label}
        title={title ?? label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => (open ? close() : setOpen(true))}
        className={`cursor-pointer ${triggerClassName}`}
        style={triggerStyle}
      >
        {children}
      </button>
      {mounted && (
        <DropdownPanel anchor={trigger} closing={closing} onOutside={close} width={280} maxHeight={520}>
          <div
            id={panelId}
            role="dialog"
            aria-label={label}
            tabIndex={-1}
            className="overflow-y-auto p-space-3 outline-none"
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Escape") {
                close();
                trigger.current?.focus();
              }
            }}
          >
            <ColorPicker value={value} onChange={onChange} swatches={swatches} recent={recent} />
          </div>
        </DropdownPanel>
      )}
    </>
  );
};

type ColorFieldProps = {
  label?: string;
  value: string;
  onChange: (hex: string) => void;
  swatches?: ColorSwatch[];
  hint?: string;
  error?: string;
  size?: FieldSize;
  className?: string;
};

/**
 * A colour as a form field: the underline field with the colour's swatch and
 * hex in it, opening the picker on press.
 */
const ColorField = ({ label, value, onChange, swatches, hint, error, size = "md", className = "" }: ColorFieldProps) => {
  const { t } = useUiStrings();
  const id = useId();
  const hex = normalizeHex(value);
  return (
    <div className={`${fieldBlockClasses(size, Boolean(label || hint || error))} ${className}`}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <ColorPopover
        id={id}
        value={hex ?? "#000000"}
        onChange={onChange}
        swatches={swatches}
        label={label ?? t.chooseColour}
        triggerClassName={`${fieldClasses(size)} flex items-center gap-space-4 text-start`}
      >
        <span aria-hidden className="size-5 shrink-0 rounded-sm shadow-edge" style={{ background: hex ?? "transparent" }} />
        <span dir="ltr" className="font-mono">
          {hex ?? t.chooseColour}
        </span>
      </ColorPopover>
      <FieldNote id={`${id}-note`} error={error} hint={hint} />
    </div>
  );
};

export { ColorField, ColorPopover };
export type { ColorFieldProps, ColorPopoverProps };
