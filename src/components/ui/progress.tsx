/** Thin loading/progress indicator; the label must describe the work. */
export function Progress({ value, label }: { value?: number; label: string }) {
  return <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value === undefined ? undefined : Math.max(0, Math.min(100, value))} className="h-1 overflow-hidden bg-surface-2">
    <div className={`h-full bg-accent transition-[width] duration-[180ms] motion-reduce:transition-none ${value === undefined ? "w-1/2 animate-pulse motion-reduce:animate-none" : ""}`} style={value === undefined ? undefined : { width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>;
}
