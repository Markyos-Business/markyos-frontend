type CountBadgeProps = {
  count: number;
  /** Above this it shows `max+`. Default 99. */
  max?: number;
  /** Read by screen readers, e.g. "3 unread". Default: the number. */
  label?: string;
  className?: string;
};

/** A small solid pill for a count that wants attention. Nothing at zero. */
const CountBadge = ({ count, max = 99, label, className = "" }: CountBadgeProps) =>
  count > 0 ? (
    <span
      aria-label={label ?? String(count)}
      className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-danger-fill px-1.5 text-ui-2xs font-medium text-danger-ink ${className}`}
    >
      {count > max ? `${max}+` : count}
    </span>
  ) : null;

export { CountBadge };
export type { CountBadgeProps };
