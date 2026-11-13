"use client";

import { useState } from "react";
import { useUiStrings } from "../ui-strings";
import { InputField, type InputFieldProps } from "./input-field";
import { ColorPopover } from "../color-picker/color-field";
import type { ColorSwatch } from "../color-picker/color-picker";

/** "#0099ff", "0099FF" or "#09f" as "#0099FF"; null when it isn't a colour. */
function normalizeHex(text: string): string | null {
  const raw = text.trim().replace(/^#/, "");
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw.toUpperCase()}`;
  if (/^[0-9a-f]{3}$/i.test(raw)) return `#${raw.replace(/./g, (c) => c + c).toUpperCase()}`;
  return null;
}

type HexColorFieldProps = Omit<InputFieldProps, "value" | "defaultValue" | "onChange" | "prefix"> & {
  /** "#RRGGBB". */
  value: string;
  onChange: (hex: string) => void;
  /** Quick picks in the swatch's picker, e.g. the brand palette. */
  swatches?: ColorSwatch[];
  invalidMessage?: string;
};

/**
 * A colour typed as hex, with its swatch in front: the swatch opens the full
 * picker, the text takes a pasted or typed code. Accepts "0099ff" and "#09f"
 * and stores "#0099FF"; anything else is an error on leaving. Controlled.
 */
const HexColorField = ({ value, onChange, swatches, invalidMessage, error, onBlur, ...rest }: HexColorFieldProps) => {
  const { t } = useUiStrings();
  const [text, setText] = useState(value);
  const [invalid, setInvalid] = useState(false);
  // A colour set from outside (the picker, a reset) replaces the text.
  const [shown, setShown] = useState(value);
  if (value !== shown) {
    setShown(value);
    setText(value);
  }
  const hex = normalizeHex(text);

  return (
    <InputField
      spellCheck={false}
      autoComplete="off"
      maxLength={7}
      dir="ltr"
      boxDir="ltr"
      inputClassName="font-mono uppercase"
      {...rest}
      value={text}
      prefix={
        <ColorPopover
          value={normalizeHex(value) ?? "#000000"}
          onChange={(next) => {
            setInvalid(false);
            onChange(next.toUpperCase());
          }}
          swatches={swatches}
          // Its own name, not the field's: two controls called "Accent colour" can't be told apart.
          label={t.chooseColour}
          triggerClassName="flex rounded-sm"
        >
          <span aria-hidden className="size-5 shrink-0 rounded-sm shadow-edge" style={{ background: hex ?? "transparent" }} />
        </ColorPopover>
      }
      error={error ?? (invalid ? (invalidMessage ?? t.invalidHex) : undefined)}
      onChange={(e) => {
        setText(e.target.value);
        const next = normalizeHex(e.target.value);
        if (next) {
          setInvalid(false);
          onChange(next);
        }
      }}
      onBlur={(e) => {
        const next = normalizeHex(text);
        setInvalid(text !== "" && !next);
        if (next) setText(next);
        onBlur?.(e);
      }}
    />
  );
};

/** HexColorInput, by the UI library's name. */
const HexColorInput = HexColorField;

export { HexColorField, HexColorInput, normalizeHex };
export type { HexColorFieldProps };
