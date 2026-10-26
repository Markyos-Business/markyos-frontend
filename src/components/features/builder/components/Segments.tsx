type SegmentsProps<T extends string | number> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Tabs over a panel (role="tablist"), rather than a setting. */
  asTabs?: boolean;
  /** The label size, which differs by how much room the row has. */
  textClass: string;
};

/** A full-width row of pill segments on a sunken track: the panel's tabs and its small either-or settings. */
export function Segments<T extends string | number>({ options, value, onChange, asTabs, textClass }: SegmentsProps<T>) {
  return (
    <div className="flex shrink-0 rounded-full bg-surface-1 p-0.5" role={asTabs ? "tablist" : undefined}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role={asTabs ? "tab" : undefined}
          aria-selected={asTabs ? value === o.value : undefined}
          onClick={() => onChange(o.value)}
          className={`h-8 flex-1 cursor-pointer rounded-full font-semibold ${textClass} ${value === o.value ? "bg-surface-2 text-text" : "text-text-faint"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
