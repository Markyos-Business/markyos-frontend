"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { IconButton } from "../../ui/buttons/IconButton";
import { useUiStrings } from "../../ui/i18n/uiStrings";
import { InputField, type InputFieldProps } from "../fields/InputField";
import { assignRef } from "../fields/TextareaField";

/** Western digits for Arabic-Indic and Persian ones, and the Arabic separators. */
function westernDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, ".")
    .replace(/٬/g, ",");
}

/** The number in what was typed, or null when there is none. */
function parseNumber(text: string): number | null {
  const clean = westernDigits(text).replace(/[^\d.-]/g, "");
  if (clean === "" || clean === "-" || clean === ".") return null;
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
}

/** "84500.5" as "84,500.5", keeping a trailing "." or "0" the person is still typing. */
function groupTyped(text: string, decimals: number): string {
  const clean = westernDigits(text).replace(/[^\d.-]/g, "");
  const negative = clean.startsWith("-");
  const [whole = "", ...frac] = clean.replace(/-/g, "").split(".");
  const grouped = whole.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fraction = frac.length ? `.${frac.join("").slice(0, decimals)}` : "";
  return `${negative ? "-" : ""}${grouped}${decimals > 0 ? fraction : ""}`;
}

const show = (n: number | null, grouping: boolean, decimals: number) =>
  n === null ? "" : grouping ? n.toLocaleString("en-US", { maximumFractionDigits: decimals }) : String(Number(n.toFixed(decimals)));

type NumberFieldProps = Omit<InputFieldProps, "type" | "value" | "defaultValue" | "onChange" | "min" | "max" | "step"> & {
  /** The number, or null for empty. */
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Digits after the point. Default 0 for steps of whole numbers, 2 otherwise. */
  decimals?: number;
  /** Thousands separators as you type ("84,500"). */
  grouping?: boolean;
  /** − and + buttons. Default true. */
  stepper?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  strings?: InputFieldProps["strings"] & { increase?: string; decrease?: string };
};

/**
 * A number: typed, stepped with − and +, or with the arrow keys (Shift for ten
 * steps, Home and End for min and max). It stores a number, never the text,
 * and accepts Arabic-Indic digits. Values are shown in Western digits and kept
 * left to right. Controlled: use react-hook-form's `Controller`.
 */
const NumberField = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  decimals: givenDecimals,
  grouping = false,
  stepper = true,
  prefix,
  suffix,
  strings,
  onBlur,
  onKeyDown,
  disabled,
  readOnly,
  locked,
  ref,
  ...rest
}: NumberFieldProps) => {
  const { t } = useUiStrings();
  const decimals = givenDecimals ?? (Number.isInteger(step) ? 0 : 2);
  const [text, setText] = useState(() => show(value, grouping, decimals));
  const focused = useRef(false);
  const input = useRef<HTMLInputElement | null>(null);
  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
  const round = (n: number) => Number(n.toFixed(decimals));
  const canChange = !disabled && !readOnly && !locked;

  // A value set from outside shows at once; while typing, the text is the person's.
  useEffect(() => {
    if (!focused.current) setText(show(value, grouping, decimals));
  }, [value, grouping, decimals]);

  const set = (n: number | null) => {
    const next = n === null ? null : round(clamp(n));
    setText(show(next, grouping, decimals));
    onChange(next);
  };
  const nudge = (by: number) => set((value ?? min ?? 0) + by);

  return (
    <InputField
      type="text"
      inputMode={decimals > 0 || (min ?? 0) < 0 ? "decimal" : "numeric"}
      dir="ltr"
      boxDir="ltr"
      autoComplete="off"
      {...rest}
      ref={(node: HTMLInputElement | null) => {
        input.current = node;
        assignRef(ref, node);
      }}
      disabled={disabled}
      readOnly={readOnly}
      locked={locked}
      role="spinbutton"
      aria-valuenow={value ?? undefined}
      aria-valuemin={min}
      aria-valuemax={max}
      value={text}
      prefix={prefix}
      suffix={suffix}
      onFocus={() => (focused.current = true)}
      onChange={(e) => {
        const el = e.target;
        // Grouping moves the caret; put it back after the same number of digits.
        const digitsBefore = westernDigits(el.value.slice(0, el.selectionStart ?? el.value.length)).replace(/[^\d.-]/g, "").length;
        const next = grouping ? groupTyped(el.value, decimals) : westernDigits(el.value).replace(/[^\d.-]/g, "");
        setText(next);
        onChange(parseNumber(next));
        if (grouping) {
          requestAnimationFrame(() => {
            if (!input.current) return;
            let seen = 0;
            let at = 0;
            while (at < next.length && seen < digitsBefore) if (/[\d.-]/.test(next[at++])) seen++;
            input.current.setSelectionRange(at, at);
          });
        }
      }}
      onBlur={(e) => {
        focused.current = false;
        // On leaving, the number is tidied and kept inside min and max.
        set(parseNumber(text));
        onBlur?.(e);
      }}
      onKeyDown={(e) => {
        if (canChange) {
          const big = e.shiftKey ? 10 : 1;
          const to: Record<string, () => void> = {
            ArrowUp: () => nudge(step * big),
            ArrowDown: () => nudge(-step * big),
            ...(min !== undefined && { Home: () => set(min) }),
            ...(max !== undefined && { End: () => set(max) }),
          };
          if (to[e.key]) {
            e.preventDefault();
            to[e.key]();
          }
        }
        onKeyDown?.(e);
      }}
      action={
        stepper && (
          <span className="-me-space-2 flex items-center">
            <IconButton
              icon="minus"
              label={strings?.decrease ?? t.decrease}
              tabIndex={-1}
              disabled={!canChange || (min !== undefined && (value ?? min) <= min)}
              onClick={() => nudge(-step)}
            />
            <IconButton
              icon="plus"
              label={strings?.increase ?? t.increase}
              tabIndex={-1}
              disabled={!canChange || (max !== undefined && (value ?? 0) >= max)}
              onClick={() => nudge(step)}
            />
          </span>
        )
      }
      strings={strings}
    />
  );
};

type CurrencyFieldProps = Omit<NumberFieldProps, "prefix" | "grouping" | "stepper"> & {
  /** The code shown before the amount: "SAR", "AED", "EGP". */
  currency?: string;
};

/**
 * An amount of money: "SAR 84,500", with separators as you type. Stores the
 * number; the currency is the caller's.
 */
const CurrencyField = ({ currency = "SAR", decimals = 2, min = 0, ...rest }: CurrencyFieldProps) => (
  <NumberField {...rest} decimals={decimals} min={min} grouping stepper={false} prefix={<span className="font-medium text-text-muted">{currency}</span>} />
);

/** A percentage, 0 to 100 unless told otherwise, with % after the value. */
const PercentageField = ({ min = 0, max = 100, ...rest }: Omit<NumberFieldProps, "suffix">) => (
  <NumberField {...rest} min={min} max={max} suffix={<span className="text-text-muted">%</span>} />
);

/** By the UI library's names. */
const NumberInput = NumberField;
const CurrencyInput = CurrencyField;
const PercentageInput = PercentageField;

export { CurrencyField, CurrencyInput, NumberField, NumberInput, PercentageField, PercentageInput, groupTyped, parseNumber, westernDigits };
export type { CurrencyFieldProps, NumberFieldProps };
