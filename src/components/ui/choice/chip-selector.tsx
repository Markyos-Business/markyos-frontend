"use client";

import { Icon } from "../icon";
import { useRadioNavigation } from "./use-radio-navigation";

type Chip<V extends string> = { value: V; label: string; /** A count beside the label: "Riyadh 12". */ count?: number; disabled?: boolean };

type ChipSelectorProps<V extends string> = {
  /** The group's accessible name. */
  label: string;
  options: readonly Chip<V>[];
  className?: string;
} & ({ multiple?: false; value: V | null; onChange: (value: V) => void } | { multiple: true; value: readonly V[]; onChange: (value: V[]) => void });

const CHIP = "flex h-8 items-center gap-space-2 whitespace-nowrap rounded-lg px-space-4 text-caption font-medium transition-[background-color,color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50";
const OFF = "bg-surface-2 text-text-muted shadow-edge hover:text-text";
const ON = "bg-accent-soft text-accent-on-soft shadow-edge-accent";

/**
 * Filter chips. Single choice is a radio group (one Tab stop, arrow keys);
 * `multiple` is a row of toggle buttons, each saying whether it's pressed and
 * showing a tick, so state is never colour alone. Chips with text use the
 * button radius, not a pill (spec §2.5).
 */
const ChipSelector = <V extends string>(props: ChipSelectorProps<V>) => {
  const { label, options, className = "" } = props;
  const { group, radioProps } = useRadioNavigation({
    items: options,
    value: props.multiple ? null : props.value,
    onChange: (v) => {
      if (!props.multiple) props.onChange(v);
    },
  });

  const count = (o: Chip<V>) =>
    o.count !== undefined && (
      <span dir="ltr" className="tabular-nums text-text-faint">
        {o.count}
      </span>
    );

  if (props.multiple) {
    const chosen = new Set(props.value);
    return (
      <div role="group" aria-label={label} className={`flex flex-wrap gap-space-3 ${className}`}>
        {options.map((o) => {
          const on = chosen.has(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              disabled={o.disabled}
              onClick={() => props.onChange(on ? props.value.filter((v) => v !== o.value) : [...props.value, o.value])}
              className={`${CHIP} ${on ? ON : OFF}`}
            >
              {on && <Icon name="check" size={16} />}
              {o.label}
              {count(o)}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={group} role="radiogroup" aria-label={label} className={`flex flex-wrap gap-space-3 ${className}`}>
      {options.map((o) => (
        <button key={o.value} type="button" {...radioProps(o)} disabled={o.disabled} onClick={() => props.onChange(o.value)} className={`${CHIP} ${o.value === props.value ? ON : OFF}`}>
          {o.label}
          {count(o)}
        </button>
      ))}
    </div>
  );
};

export { ChipSelector };
export type { Chip, ChipSelectorProps };
