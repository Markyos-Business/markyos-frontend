"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode, Ref } from "react";
import { DropdownPanel } from "../listbox/dropdown-panel";
import { Field, type FieldSize, type FieldState } from "../field/field";
import { useUiStrings } from "../ui-strings";
import { useRecentColours } from "./use-recent-colours";
import { ColorPicker, type ColorSwatch } from "./color-picker";
import { normalizeHex } from "@/lib/color";
import { usePresence } from "@/hooks/usePresence";

type ColorPopoverProps = {
  value: string;
  onChange: (hex: string) => void;
  swatches?: ColorSwatch[];
  /** The picker checks the colour against this background (ratio + AA badge). */
  contrastWith?: string;
  /** The trigger's accessible name, e.g. "Card colour". */
  label: string;
  /** What the trigger shows: a swatch, an icon. */
  children: ReactNode;
  triggerClassName?: string;
  triggerStyle?: CSSProperties;
  title?: string;
  /** For a `<label htmlFor>` outside. */
  id?: string;
  /** More on the trigger: a field's aria-describedby, aria-invalid, disabled. */
  triggerProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type" | "children">;
  /** Shown but not opened: a read-only or locked field. */
  inert?: boolean;
  /** The trigger, for a form library to focus. */
  ref?: Ref<HTMLButtonElement>;
  /** After it closes: a field's blur. */
  onClose?: () => void;
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
const ColorPopover = ({ value, onChange, swatches, contrastWith, label, children, triggerClassName = "", triggerStyle, title, id, triggerProps, inert = false, ref, onClose }: ColorPopoverProps) => {
  const [open, setOpen] = useState(false);
  const { mounted, closing } = usePresence(open);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const setTrigger = useCallback(
    (el: HTMLButtonElement | null) => {
      trigger.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );
  const panelId = useId();
  const { recent, remember } = useRecentColours();
  // The colour it closes on is the one chosen; dragging through others doesn't count.
  const close = useCallback(() => {
    setOpen(false);
    remember(value);
    onClose?.();
  }, [remember, value, onClose]);

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
        {...triggerProps}
        ref={setTrigger}
        id={id}
        type="button"
        aria-label={label}
        title={title ?? label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => (open ? close() : !inert && !triggerProps?.disabled && setOpen(true))}
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
            <ColorPicker value={value} onChange={onChange} swatches={swatches} recent={recent} contrastWith={contrastWith} />
          </div>
        </DropdownPanel>
      )}
    </>
  );
};

type ColorFieldProps = FieldState & {
  label?: string;
  /** "#RRGGBB". Controlled with `onChange`; or `defaultValue`. */
  value?: string;
  defaultValue?: string;
  onChange?: (hex: string) => void;
  /** When the picker closes, as a field's blur. */
  onBlur?: () => void;
  /** Submitted with a native form as "#RRGGBB". */
  name?: string;
  swatches?: ColorSwatch[];
  /** Check the colour against this background in the picker. */
  contrastWith?: string;
  size?: FieldSize;
  className?: string;
  /** The trigger button, for `Controller` to focus on an error. */
  ref?: Ref<HTMLButtonElement>;
  labels?: { chooseColour?: string };
};

/**
 * ColorPicker as a form field: the trigger shows the swatch and the hex
 * (left to right in any language) and opens the picker: the colour area
 * (arrow keys move in it), hue, the hex input, the brand swatches, the last 8
 * colours, the eyedropper where the browser has one and, with
 * `contrastWith`, an AA check. Every Field state applies; read-only and
 * locked show the colour without opening.
 */
const ColorField = ({ label, value, defaultValue, onChange, onBlur, name, swatches, contrastWith, size = "md", className = "", ref, labels, ...state }: ColorFieldProps) => {
  const { t } = useUiStrings();
  const [own, setOwn] = useState(defaultValue ?? "");
  const hex = normalizeHex(value ?? own);
  const choose = labels?.chooseColour ?? t.chooseColour;
  return (
    // The hex reads left to right in any language, so its box does too (as HexColorInput's).
    <Field label={label} size={size} className={className} boxDir="ltr" {...state}>
      {({ readOnly, required, ...control }) => (
        <>
          <ColorPopover
            ref={ref}
            id={control.id}
            value={hex ?? "#000000"}
            onChange={(next) => {
              if (value === undefined) setOwn(next);
              onChange?.(next);
            }}
            onClose={onBlur}
            swatches={swatches}
            contrastWith={contrastWith}
            label={label ?? choose}
            inert={readOnly}
            triggerProps={{ ...control, "aria-labelledby": label ? `${control.id}-label ${control.id}-value` : undefined, disabled: control.disabled }}
            triggerClassName="mk-field-control flex min-w-0 items-center gap-space-4 text-start disabled:cursor-not-allowed"
          >
            <span aria-hidden className="size-5 shrink-0 rounded-sm shadow-edge" style={{ background: hex ?? "transparent" }} />
            <span id={`${control.id}-value`} dir="ltr" className={hex ? "font-mono" : "text-text-muted"}>
              {hex ?? choose}
            </span>
          </ColorPopover>
          {name && <input type="hidden" name={name} value={hex ?? ""} required={required} />}
        </>
      )}
    </Field>
  );
};

export { ColorField, ColorPopover };
export type { ColorFieldProps, ColorPopoverProps };
