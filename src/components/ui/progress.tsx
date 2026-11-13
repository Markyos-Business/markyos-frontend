type ProgressTone = "accent" | "success" | "warning" | "danger";

type ProgressProps = {
  /** 0–100; leave it out while the amount is unknown (a pulse instead). */
  value?: number;
  /** What the work is: "Uploading Riyadh.png". Required, so the bar is never anonymous. */
  label: string;
  /** `sm` is the thin 4px line; `md` the spec's 6px rounded track (§6.10). Default `sm`. */
  size?: "sm" | "md";
  tone?: ProgressTone;
  /** The percentage beside the bar. */
  showValue?: boolean;
};

const FILL: Record<ProgressTone, string> = { accent: "bg-accent", success: "bg-success", warning: "bg-warning", danger: "bg-danger-fill" };

/** A progress bar: determinate with `value`, or a pulse while the amount is unknown. */
export function Progress({ value, label, size = "sm", tone = "accent", showValue = false }: ProgressProps) {
  const pct = value === undefined ? undefined : Math.max(0, Math.min(100, Math.round(value)));
  const bar = (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={`min-w-0 flex-1 overflow-hidden ${size === "md" ? "h-1.5 rounded-full bg-ink-soft" : "h-1 bg-surface-2"}`}
    >
      <div
        className={`h-full ${FILL[tone]} transition-[width] duration-base motion-reduce:transition-none ${size === "md" ? "rounded-full" : ""} ${pct === undefined ? "w-1/2 animate-pulse motion-reduce:animate-none" : ""}`}
        style={pct === undefined ? undefined : { width: `${pct}%` }}
      />
    </div>
  );
  if (!showValue || pct === undefined) return bar;
  return (
    <div className="flex items-center gap-space-3">
      {bar}
      <span dir="ltr" className="shrink-0 text-caption font-medium tabular-nums text-text-muted">
        {pct}%
      </span>
    </div>
  );
}

export type { ProgressProps, ProgressTone };
