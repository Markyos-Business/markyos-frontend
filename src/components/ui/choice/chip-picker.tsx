"use client";

type ChipOption<T extends string> = { value: T; label: string; disabled?: boolean; title?: string };

type ChipPickerTone = "solid" | "accent";

type ChipPickerProps<T extends string> = {
  options: ChipOption<T>[];
  /** The chosen chip; none is chosen while it matches no option. */
  value: T;
  onChange: (value: T) => void;
  /** How the chosen chip stands out: the theme's ink, or the accent tint. */
  tone?: ChipPickerTone;
  className?: string;
};

const chosen: Record<ChipPickerTone, string> = {
  solid: "bg-solid text-solid-ink",
  accent: "bg-accent-soft text-accent-on-soft",
};

/**
 * One choice from a short list, as a row of 32px chips. For dense inline
 * forms (a role, a kind of item); a full form uses `RadioField`.
 */
export function ChipPicker<T extends string>({ options, value, onChange, tone = "solid", className = "" }: ChipPickerProps<T>) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          disabled={o.disabled}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={`h-8 cursor-pointer rounded-full px-3 text-[11px] font-semibold ${value === o.value ? chosen[tone] : "bg-surface-1 text-text-muted"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
