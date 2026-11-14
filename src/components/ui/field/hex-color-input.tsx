"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { ChangeEvent, ClipboardEvent, FocusEvent, Ref } from "react";
import { normalizeHex, parseColorText } from "@/lib/color";
import { useUiStrings } from "../ui-strings";
import { InputField, type InputFieldProps } from "./input-field";
import { ColorPopover } from "../color-picker/color-field";
import type { ColorSwatch } from "../color-picker/color-picker";

type HexColorInputProps = Omit<InputFieldProps, "prefix" | "onChange" | "value" | "defaultValue" | "ref"> & {
  /** "#RRGGBB". With `onChange` it's controlled; on its own it's the committed colour. */
  value?: string;
  defaultValue?: string;
  /** Every keystroke, as an input event: what `register` and `Controller` expect. */
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Only a complete colour, as "#RRGGBB" upper case. */
  onValueChange?: (hex: string) => void;
  /** The swatch opens the full ColorPicker. Off: it's a preview only. */
  picker?: boolean;
  /** The picker's quick picks, e.g. the brand palette. Needs `picker`. */
  swatches?: ColorSwatch[];
  /** The picker shows the contrast against this colour, with an AA badge. Needs `picker`. */
  contrastWith?: string;
  labels?: { invalid?: string; chooseColour?: string };
  ref?: Ref<HTMLInputElement>;
};

/**
 * Sets an input's value the way typing does, so React's `onChange` fires and
 * anything listening (react-hook-form, a controlled parent) hears it.
 */
function typeInto(input: HTMLInputElement, text: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, text);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * A colour typed as hex, its swatch in front and the "#" always first.
 *
 * Takes "#0B5D6D", "0b5d6d" or "#0bd" and stores "#0B5D6D"; a pasted
 * "rgb(11, 93, 109)" or a hex without its "#" becomes the hex at once.
 * Anything else is an error when focus leaves. The value is left to right in
 * any language. Works controlled (`value` + `onChange`), uncontrolled
 * (`defaultValue`) and with react-hook-form's `register` or `Controller`;
 * every change it makes itself (the paste, the tidy-up on leaving, the
 * picker) arrives as an ordinary input event.
 */
const HexColorInput = ({
  value,
  defaultValue,
  onChange,
  onValueChange,
  picker = false,
  swatches,
  contrastWith,
  labels,
  error,
  onBlur,
  onPaste,
  ref,
  ...rest
}: HexColorInputProps) => {
  const { t } = useUiStrings();
  const input = useRef<HTMLInputElement | null>(null);
  const setRef = useCallback(
    (el: HTMLInputElement | null) => {
      input.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );
  // `value` with no `onChange`: the text is ours until it's a colour.
  const draft = value !== undefined && onChange === undefined;
  const controlled = value !== undefined && !draft;
  const [text, setText] = useState(value ?? defaultValue ?? "");
  const [synced, setSynced] = useState(value);
  if (draft && value !== synced) {
    setSynced(value);
    setText(value);
  }
  // Uncontrolled, a form library may have set the value directly.
  useLayoutEffect(() => {
    if (value === undefined && input.current) setText(input.current.value);
  }, [value]);
  const [invalid, setInvalid] = useState(false);
  const shown = controlled ? value : text;
  const hex = parseColorText(shown);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // The "#" comes first however it's typed.
    if (/^[0-9a-f]+$/i.test(raw)) {
      e.target.value = `#${raw}`;
      const caret = (e.target.selectionStart ?? raw.length) + 1;
      requestAnimationFrame(() => input.current?.setSelectionRange(caret, caret));
    }
    const next = e.target.value;
    setText(next);
    setInvalid(false);
    onChange?.(e);
    // A colour mid-typing ("#0B5" is a short hex) waits for all six digits.
    const full = normalizeHex(next);
    if (full && next.replace("#", "").length === 6) onValueChange?.(full);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    onPaste?.(e);
    const pasted = e.clipboardData.getData("text");
    const next = parseColorText(pasted);
    if (!next || e.defaultPrevented) return;
    e.preventDefault();
    typeInto(e.currentTarget, next);
    onValueChange?.(next);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const current = e.currentTarget.value;
    const next = parseColorText(current);
    setInvalid(current !== "" && !next);
    if (next && next !== current) typeInto(e.currentTarget, next);
    if (next) onValueChange?.(next);
    onBlur?.(e);
  };

  const swatch = <span aria-hidden className="size-5 shrink-0 rounded-sm shadow-edge" style={{ background: hex ?? "transparent" }} />;

  return (
    <InputField
      spellCheck={false}
      autoComplete="off"
      autoCapitalize="characters"
      maxLength={7}
      placeholder="#0B5D6D"
      dir="ltr"
      boxDir="ltr"
      inputClassName="font-mono uppercase"
      {...rest}
      ref={setRef}
      {...(controlled ? { value } : draft ? { value: text } : { defaultValue })}
      prefix={
        picker && !rest.disabled && !rest.readOnly && !rest.locked ? (
          <ColorPopover
            value={hex ?? "#000000"}
            onChange={(next) => input.current && typeInto(input.current, next.toUpperCase())}
            swatches={swatches}
            contrastWith={contrastWith}
            // Its own name, not the field's: two controls called "Accent colour" can't be told apart.
            label={labels?.chooseColour ?? t.chooseColour}
            triggerClassName="flex rounded-sm"
          >
            {swatch}
          </ColorPopover>
        ) : (
          swatch
        )
      }
      error={error ?? (invalid ? (labels?.invalid ?? t.invalidHex) : undefined)}
      onChange={handleChange}
      onPaste={handlePaste}
      onBlur={handleBlur}
    />
  );
};

type HexColorFieldProps = Omit<HexColorInputProps, "value" | "onChange" | "onValueChange"> & {
  value: string;
  onChange: (hex: string) => void;
  invalidMessage?: string;
};

/** The colour field with its picker: HexColorInput whose swatch opens ColorPicker. */
const HexColorField = ({ onChange, invalidMessage, labels, ...rest }: HexColorFieldProps) => (
  <HexColorInput picker {...rest} labels={{ invalid: invalidMessage, ...labels }} onValueChange={onChange} />
);

export { HexColorField, HexColorInput, normalizeHex, parseColorText };
export type { HexColorFieldProps, HexColorInputProps };
